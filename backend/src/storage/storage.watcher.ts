import { TaskEither, Either, createBadRequestError } from '@eleven-am/fp';
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MediaType, CloudStorage, Media, CloudDrive } from '@prisma/client';
import { Queue } from 'bullmq';
import path from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_ADDED_EVENT, ScanQueue } from '../scanner/scanner.constants';
import { NewEpisodesEvent, NewMediaEvent, ScanLibraryEvent } from '../scanner/scanner.contracts';
import { DedupeCache } from '../utils/dedupeCache';
import { FileWatcher } from './file.watcher';

import { FolderType } from './storage.schema';
import { StorageService } from './storage.service';

@Injectable()
export class StorageWatcher implements OnModuleInit, OnModuleDestroy {
    private readonly folders: FolderType[] = [];
    private watcher: FileWatcher | undefined;
    private readonly showCache: DedupeCache<Media>;
    private readonly logger = new Logger(StorageWatcher.name);

    constructor (
        private readonly prismaService: PrismaService,
        private readonly storageService: StorageService,
        @ScanQueue() private readonly scanQueue: Queue<NewEpisodesEvent | NewMediaEvent | ScanLibraryEvent>,
    ) {
        this.showCache = this.createShowCache();
    }

    onModuleInit () {
        return TaskEither
            .tryCatch(
                () => this.prismaService.cloudStorage.findMany({
                    where: {
                        drive: CloudDrive.LOCAL,
                    },
                }),
                'Failed to get storage locations',
            )
            .mapItems((storage) => ({
                showLocations: storage.showLocations.map((location): FolderType => ({
                    path: location,
                    type: MediaType.SHOW,
                    storageId: storage.id,
                })),
                movieLocations: storage.movieLocations.map((location): FolderType => ({
                    path: location,
                    type: MediaType.MOVIE,
                    storageId: storage.id,
                })),
            }))
            .mapItems((locations) => locations.showLocations.concat(locations.movieLocations))
            .map((folders) => folders.flat())
            //.map((folders) => this.setWatcher(folders))
            .map(() => ({
                message: 'Storage watcher started',
            }))
            .toPromise();
    }

    onModuleDestroy () {
        this.watcher?.stop()
    }

    private handleFileAdded (path: string) {
        return this.folderFromPath(path)
            .toTaskEither()
            .ioSync((folder) => this.logger.log(`${folder.type} File added: ${path} in ${folder.path}`))
            .matchTask([
                {
                    predicate: (folder) => folder.type === MediaType.MOVIE,
                    run: (folder) => this.movieFileAdded(path, folder.storageId),
                },
                {
                    predicate: (folder) => folder.type === MediaType.SHOW,
                    run: (folder) => this.showFileChanged(folder, path),
                },
            ])
            .toResult();
    }

    private handleFileRemoved (path: string) {
        return this.folderFromPath(path)
            .toTaskEither()
            .ioSync((folder) => this.logger.log(`${folder.type} File removed: ${path} in ${folder.path}`))
            .matchTask([
                {
                    predicate: (folder) => folder.type === MediaType.MOVIE,
                    run: (folder) => this.movieFileRemoved(path, folder.storageId),
                },
                {
                    predicate: (folder) => folder.type === MediaType.SHOW,
                    run: (folder) => this.showFileChanged(folder, path),
                },
            ])
            .toResult();
    }

    private handleFolderAdded (path: string) {
        return this.folderFromPath(path)
            .toTaskEither()
            .ioSync((folder) => this.logger.log(`${folder.type} Folder added: ${path} in ${folder.path}`))
            .matchTask([
                {
                    predicate: (folder) => folder.type === MediaType.MOVIE,
                    run: (folder) => this.movieFolderChanged(folder),
                },
                {
                    predicate: (folder) => folder.type === MediaType.SHOW,
                    run: (folder) => this.showFolderAdded(folder, path),
                },
            ])
            .toResult();
    }

    private handleFolderRemoved (path: string) {
        return this.folderFromPath(path)
            .toTaskEither()
            .ioSync((folder) => this.logger.log(`${folder.type} Folder removed: ${path} in ${folder.path}`))
            .matchTask([
                {
                    predicate: (folder) => folder.type === MediaType.MOVIE,
                    run: (folder) => this.movieFolderChanged(folder),
                },
                {
                    predicate: (folder) => folder.type === MediaType.SHOW,
                    run: (folder) => this.showFolderRemoved(folder, path),
                },
            ])
            .toResult();
    }

    private addFolder (folder: string, storageId: string, type: MediaType) {
        console.log(`Adding folder: ${folder} in storage: ${storageId}`);
        return Either
            .of(this.folders)
            .mapItems((folder) => folder.path)
            .filter(
                (folders) => !folders.includes(folder),
                () => createBadRequestError('Folder already exists'),
            )
            .map(() => this.watcher?.add(folder))
            .map((): FolderType => ({
                path: folder,
                storageId,
                type,
            }))
            .map((folder) => this.folders.push(folder))
            .ioSync(() => this.logger.log(`Watching folder: ${folder} in storage: ${storageId}`));
    }

    private setWatcher (folders: FolderType[]) {
        try {
            this.logger.log(`Setting watcher to monitor ${folders.length} folders`);
            const paths = folders.map((folder) => folder.path);
            this.watcher?.stop();

            this.watcher = new FileWatcher({
                depth: 3,
                folders: paths,
                intervalMs: 60 * 1000,
            });

            this.watcher.on('addFile', this.handleFileAdded.bind(this));
            this.watcher.on('unlinkFile', this.handleFileRemoved.bind(this));
            this.watcher.on('addFolder', this.handleFolderAdded.bind(this));
            this.watcher.on('unlinkFolder', this.handleFolderRemoved.bind(this));

            this.folders.push(...folders);

            this.watcher.watch();
        } catch (error) {
            this.logger.error('Failed to set watcher', error);
        }
    }

    private movieFileAdded (path: string, storageId: string) {
        return this.isMediaFile(path)
            .toTaskEither()
            .chain((path) => this.storageService.getFile(storageId, path))
            .map((file) => new NewMediaEvent(file, MediaType.MOVIE))
            .chain((event) => this.emitScanEvent(event))
            .map(() => undefined);
    }

    private movieFileRemoved (path: string, storageId: string) {
        return this.isMediaFile(path)
            .toTaskEither()
            .chain((path) => TaskEither
                .tryCatch(
                    () => this.prismaService
                        .media
                        .findFirst({
                            where: {
                                type: MediaType.MOVIE,
                                videos: {
                                    some: {
                                        location: path,
                                        cloudStorageId: storageId,
                                    },
                                },
                            },
                        }),
                ))
            .nonNullable('Media not found')
            .chain((media) => TaskEither
                .tryCatch(
                    () => this.prismaService.media.delete({
                        where: {
                            id: media.id,
                        },
                    }),
                ))
            .map(() => undefined);
    }

    private showFileChanged (folder: FolderType, path: string) {
        return this.showFromPath(folder, path)
            .map((show) => this.showCache.add(show));
    }

    private movieFolderChanged (folder: FolderType) {
        return TaskEither.of(folder)
            .map(() => undefined);
    }

    private showFolderAdded (folder: FolderType, dirPath: string) {
        return this.getRelativePath(folder.path, dirPath)
            .toTaskEither()
            .matchTask([
                {
                    predicate: (subFolder) => subFolder === dirPath,
                    run: () => this.storageService.getFile(folder.storageId, dirPath)
                        .map((file) => new NewMediaEvent(file, folder.type))
                        .chain((event) => this.emitScanEvent(event))
                        .map(() => undefined),
                },
                {
                    predicate: (subFolder) => subFolder !== dirPath,
                    run: (subFolder) => this.showFromPath(folder, subFolder)
                        .map((show) => this.showCache.add(show)),
                },
            ]);
    }

    private showFolderRemoved (folder: FolderType, dirPath: string) {
        const deleteShow = (show: Media) => TaskEither
            .tryCatch(
                () => this.prismaService.media.delete({
                    where: {
                        id: show.id,
                    },
                }),
            );

        return this.getRelativePath(folder.path, dirPath)
            .toTaskEither()
            .matchTask([
                {
                    predicate: (subFolder) => subFolder === dirPath,
                    run: () => this.showFromPath(folder, dirPath)
                        .chain(deleteShow)
                        .map(() => undefined),
                },
                {
                    predicate: (subFolder) => subFolder !== dirPath,
                    run: (subFolder) => this.showFromPath(folder, subFolder)
                        .map((show) => this.showCache.add(show)),
                },
            ]);
    }

    @OnEvent(STORAGE_ADDED_EVENT)
    private storageAdded (storage: CloudStorage) {
        if (storage.drive !== CloudDrive.LOCAL) {
            return TaskEither.of(undefined);
        }

        const addFolders = (folders: string[], type: MediaType) => TaskEither
            .of(folders)
            .executeSequentially((folder) => this.addFolder(folder, storage.id, type)
                .toTaskEither());

        return TaskEither
            .all(
                addFolders(storage.movieLocations, MediaType.MOVIE),
                addFolders(storage.showLocations, MediaType.SHOW),
            )
            .toResult();
    }

    private isMediaFile (path: string) {
        const mediaExtensions = ['.mkv', '.mp4', '.avi', '.mov', '.flv', '.wmv', '.webm', '.m4v'];

        return Either
            .of(path)
            .filter(
                (path) => mediaExtensions.some((ext) => path.endsWith(ext)),
                () => createBadRequestError('File is not a media file'),
            );
    }

    private emitScanEvent (event: NewMediaEvent | NewEpisodesEvent | ScanLibraryEvent) {
        return TaskEither
            .of(event)
            .matchTask([
                {
                    predicate: (event) => event instanceof NewMediaEvent,
                    run: (event: NewMediaEvent) => TaskEither
                        .tryCatch(() => this.scanQueue.add(event.file.path, event), 'Failed to add scan job'),
                },
                {
                    predicate: (event) => event instanceof NewEpisodesEvent,
                    run: (event: NewEpisodesEvent) => TaskEither
                        .tryCatch(() => this.scanQueue.add(event.show.id, event), 'Failed to add scan job'),
                },
                {
                    predicate: (event) => event instanceof ScanLibraryEvent,
                    run: (event: ScanLibraryEvent) => TaskEither
                        .tryCatch(() => this.scanQueue.add(event.library.id, event), 'Failed to add scan job'),
                },
            ]);
    }

    private showFromPath (folder: FolderType, filePath: string) {
        return this.getRelativePath(folder.path, filePath)
            .toTaskEither()
            .chain((folderPath) => TaskEither
                .tryCatch(
                    () => this.prismaService.media.findFirst({
                        where: {
                            folder: {
                                location: folderPath,
                                cloudStorageId: folder.storageId,
                            },
                        },
                    }),
                ))
            .nonNullable('Show not found');
    }

    private createShowCache () {
        return new DedupeCache<Media>({
            processor: (shows) => TaskEither
                .of(shows)
                .mapItems((show) => new NewEpisodesEvent(show))
                .chainItems((event) => this.emitScanEvent(event)),
        });
    }

    private getRelativePath (folder: string, filePath: string) {
        return Either.of(filePath)
            .map((filePath) => path.relative(folder, filePath))
            .map((relative) => relative.split(path.sep)[0])
            .nonNullable('File is not in a current folder')
            .map((relative) => path.join(folder, relative));
    }

    private folderFromPath (filePath: string) {
        const folder = this.folders.find((folder) => filePath.startsWith(folder.path));

        return Either.fromNullable(folder);
    }
}
