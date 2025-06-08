import { TaskEither, createBadRequestError, createInternalError, difference } from '@eleven-am/fp';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CloudStorage, Folder, Media, MediaType, Video, User } from '@prisma/client';
import { Queue } from 'bullmq';

import { ScanQueue, STORAGE_ADDED_EVENT, EPISODES_CHANGED_EVENT } from './scanner.constants';
import {
    EditMediaSchema,
    EpisodeFileSchema,
    GetImagesSchema,
    GetMediaSchema,
    ScanEpisodeResult,
    ScanResult,
    NewEpisodesEvent,
    ScanLibraryEvent,
    LibraryScanType,
    StorageDetailSchema,
    CreateMediaArgs,
    UnScannedItemSchema,
    UnScannedArgs,
    CreateFromTmdbIdArgs,
} from './scanner.contracts';
import { ScannerIdentifier } from './scanner.identifier';
import { LLMService } from '../misc/llm.service';
import { OpenSubtitlesService } from '../misc/openSubtitles.service';
import { PrismaService } from '../prisma/prisma.service';
import { FramesFile } from '../storage/storage.schema';
import { StorageService } from '../storage/storage.service';
import { PageResponse } from '../utils/utils.contracts';


@Injectable()
export class ScannerService implements OnModuleInit {
    constructor (
        @ScanQueue() private readonly scanQueue: Queue<NewEpisodesEvent | ScanLibraryEvent>,
        private readonly openSubtitles: OpenSubtitlesService,
        private readonly scanIdentifier: ScannerIdentifier,
        private readonly storageService: StorageService,
        private readonly prismaService: PrismaService,
        private readonly llmService: LLMService,
    ) {}

    onModuleInit () {
        return this.requestServerScan().toPromise();
    }

    requestServerScan () {
        return TaskEither
            .tryCatch(
                () => this.prismaService.cloudStorage.findMany(),
                'Failed to retrieve cloud storages',
            )
            .chainItems((storage) => this.requestLibraryScan(storage))
            .map(() => ({
                message: 'Server will be scanned',
            }));
    }

    requestLibraryScan (library: CloudStorage) {
        return this.addLibraryToScanQueue(library, LibraryScanType.ALL)
            .map(() => ({
                message: `Library ${library.name} will be scanned`,
            }));
    }

    requestMoviesScan (library: CloudStorage) {
        return this.addLibraryToScanQueue(library, LibraryScanType.MOVIE)
            .map(() => ({
                message: `Movies from library ${library.name} will be scanned`,
            }));
    }

    requestShowsScan (library: CloudStorage) {
        return this.addLibraryToScanQueue(library, LibraryScanType.SHOW)
            .map(() => ({
                message: `Shows from library ${library.name} will be scanned`,
            }));
    }

    requestEpisodesInShowScan (show: Media) {
        return this.addEpisodesToScanQueue(show)
            .map(() => ({
                message: `Episodes from show ${show.name} will be scanned`,
            }));
    }

    getMediaForEdit (media: Media) {
        return this.storageService.getObjectFromMedia(media)
            .map((file): GetMediaSchema => ({
                id: media.id,
                type: media.type,
                name: media.name,
                tmdbId: media.tmdbId,
                backdrop: media.backdrop,
                poster: media.poster,
                logo: media.logo,
                portrait: media.portrait,
                fileName: file.name,
            }));
    }

    getMediaImages (query: GetImagesSchema) {
        return this.scanIdentifier.getMediaImages(query);
    }

    getMediaFromTmdbId ({ tmdbId, type }: GetImagesSchema) {
        return this.scanIdentifier.getMediaFromTmdbId(tmdbId, type);
    }

    getEpisodesForEdit (media: Media) {
        return TaskEither
            .tryCatch(
                () => this.prismaService.media.findUnique({
                    where: {
                        id: media.id,
                    },
                    include: {
                        episodes: {
                            include: {
                                video: true,
                            },
                        },
                    },
                }),
                'Failed to find media',
            )
            .nonNullable('Media not found')
            .filter(
                (media) => media.episodes.length > 0,
                () => createBadRequestError('No episodes found'),
            )
            .map((media) => media.episodes)
            .chainItems((episode) => this.storageService.getObjectFromFolder(episode.video)
                .map((file): EpisodeFileSchema => ({
                    episodeId: episode.id,
                    season: episode.season,
                    episode: episode.episode,
                    fileName: file.name,
                })));
    }

    updateMedia (media: Media, params: EditMediaSchema) {
        const tmdbChanged = this.storageService.getObjectFromMedia(media)
            .chain((file) => this.scanIdentifier.buildFromTmdbId(params.tmdbId, media.type, file))
            .chain((result) => TaskEither
                .tryCatch(
                    () => this.prismaService.media.update({
                        where: { id: media.id },
                        data: {
                            name: result.name,
                            backdrop: result.images.backdrop,
                            poster: result.images.poster,
                            logo: result.images.logo,
                            genres: result.genres,
                            tmdbId: result.tmdbId,
                            releaseDate: result.releaseDate,
                            backdropBlur: result.images.backdropAvgColor,
                            posterBlur: result.images.posterAvgColor,
                            logoBlur: result.images.logoAvgColor,
                            portrait: result.images.portrait,
                            portraitBlur: result.images.portraitAvgColor,
                            credits: {
                                deleteMany: {},
                                createMany: {
                                    data: result.credits,
                                },
                            },
                            embeds: {
                                'delete': {},
                            },
                            companies: {
                                deleteMany: {},
                                create: result.companies.map((company) => ({
                                    company: {
                                        connectOrCreate: {
                                            where: {
                                                companyType: {
                                                    tmdbId: company.tmdbId,
                                                    type: company.type,
                                                },
                                            },
                                            create: {
                                                ...company,
                                            },
                                        },
                                    },
                                })),
                            },
                        },
                    }),
                    'Failed to update media',
                )
                .chain((media) => this.llmService.saveMediaEmbed(result, media.id)
                    .map(() => media)));

        const manageImage = (url: string | null, originalUrl: string | null) => TaskEither
            .of(originalUrl)
            .filter(
                (originalUrl) => originalUrl !== url,
                () => createBadRequestError('Image is the same'),
            )
            .chain(() => this.scanIdentifier
                .imagesService
                .getAverageColorFromUrl(url))
            .map((color) => ({
                url: url!,
                color,
            }));

        const posterChanged = manageImage(params.poster, media.poster)
            .map((image) => ({
                poster: image.url,
                posterBlur: image.color,
            }))
            .orElse(() => TaskEither.of({
                poster: media.poster,
                posterBlur: media.posterBlur,
            }));

        const backdropChanged = manageImage(params.backdrop, media.backdrop)
            .map((image) => ({
                backdrop: image.url,
                backdropBlur: image.color,
            }))
            .orElse(() => TaskEither.of({
                backdrop: media.backdrop,
                backdropBlur: media.backdropBlur,
            }));

        const logoChanged = manageImage(params.logo, media.logo)
            .map<{logo: string | null, logoBlur: string | null}>((image) => ({
                logo: image.url,
                logoBlur: image.color,
            }))
            .orElse(() => TaskEither.of({
                logo: media.logo,
                logoBlur: media.logoBlur,
            }));

        const portraitChanged = manageImage(params.portrait, media.portrait)
            .map((image) => ({
                portrait: image.url,
                portraitBlur: image.color,
            }))
            .orElse(() => TaskEither.of({
                portrait: media.portrait,
                portraitBlur: media.portraitBlur,
            }));

        const imagesChanged = TaskEither
            .fromBind({
                poster: posterChanged,
                backdrop: backdropChanged,
                logo: logoChanged,
                portrait: portraitChanged,
            })
            .chain((images) => TaskEither
                .tryCatch(
                    () => this.prismaService.media.update({
                        where: { id: media.id },
                        data: {
                            ...images.poster,
                            ...images.backdrop,
                            ...images.logo,
                            ...images.portrait,
                            name: params.name,
                        },
                    }),
                    'Failed to update media images',
                ))
            .map((media) => media);

        return TaskEither
            .of(params)
            .matchTask([
                {
                    predicate: (params) => params.tmdbId !== media.tmdbId,
                    run: () => tmdbChanged,
                },
                {
                    predicate: (params) => params.poster !== media.poster || params.backdrop !== media.backdrop || params.logo !== media.logo || params.portrait !== media.portrait,
                    run: () => imagesChanged,
                },
                {
                    predicate: (params) => media.name !== params.name,
                    run: () => TaskEither
                        .tryCatch(
                            () => this.prismaService.media.update({
                                where: { id: media.id },
                                data: {
                                    name: params.name,
                                },
                            }),
                            'Failed to update media name',
                        ),
                },
                {
                    predicate: () => true,
                    run: () => TaskEither.of(media),
                },
            ])
            .chain((media) => this.getMediaForEdit(media));
    }

    createFromTmdbId (params: CreateFromTmdbIdArgs) {
        return this.storageService.getFile(params.storageId, params.filepath)
            .chain((file) => this.scanIdentifier.buildFromTmdbId(params.tmdbId, params.type, file))
            .matchTask([
                {
                    predicate: (media) => media.type === MediaType.MOVIE,
                    run: (movie) => this.saveMovie(movie),
                },
                {
                    predicate: (media) => media.type === MediaType.SHOW,
                    run: (show) => this.saveShow(show).map((show) => show.id),
                },
            ])
            .map(() => ({
                message: 'Media has been created',
            }));
    }

    deleteMedia (media: Media) {
        return TaskEither
            .tryCatch(
                () => this.prismaService.media.delete({
                    where: { id: media.id },
                    include: {
                        videos: true,
                        folder: true,
                    },
                }),
                'Failed to delete media',
            )
            .matchTask([
                {
                    predicate: (media) => media.type === MediaType.SHOW && media.folder !== null,
                    run: (media) => this.storageService.deleteFileOrFolder(media.folder!.cloudStorageId, media.folder!.location),
                },
                {
                    predicate: (media) => media.type === MediaType.MOVIE && media.videos.length > 0,
                    run: (media) => TaskEither
                        .of(media.videos)
                        .chainItems((video) => this.storageService.deleteFileOrFolder(video.cloudStorageId, video.location))
                        .map(() => true),
                },
            ]);
    }

    scanMovie (file: FramesFile) {
        return this.scanIdentifier.buildMedia(file, MediaType.MOVIE)
            .chain((movie) => this.saveMovie(movie))
            .map(() => ({
                message: 'Movie has been scanned',
            }));
    }

    scanShow (file: FramesFile) {
        return this.scanIdentifier.buildMedia(file, MediaType.SHOW)
            .chain((show) => this.saveShow(show))
            .map(() => ({
                message: 'Show has been scanned',
            }));
    }

    @OnEvent(STORAGE_ADDED_EVENT)
    scanStorage (storage: CloudStorage) {
        return TaskEither
            .all(
                this.scanMovies(storage),
                this.scanShows(storage),
            )
            .map(() => ({
                message: `All media from storage ${storage.name} has been scanned`,
            }))
            .toResult();
    }

    scanMovies (storage: CloudStorage) {
        return this.getUnScannedMovies(storage)
            .executeSequentially((file) => this.scanMovie(file))
            .map(() => ({
                message: `All movies from storage ${storage.name} have been scanned`,
            }));
    }

    scanShows (storage: CloudStorage) {
        const scanShow = this.getUnScannedShows(storage)
            .executeSequentially((file) => this.scanShow(file));

        const scanEpisodes = TaskEither
            .tryCatch(
                () => this.prismaService.cloudStorage.findUnique({
                    where: { id: storage.id },
                    include: {
                        folders: {
                            include: {
                                media: true,
                            },
                        },
                    },
                }),
                'Failed to retrieve storage',
            )
            .nonNullable('Storage not found')
            .map((storage) => storage.folders)
            .mapItems((folder) => folder.media)
            .executeSequentially((show) => this.scanEpisodesInShow(show));

        return TaskEither
            .all(scanShow, scanEpisodes)
            .map(() => ({
                message: `All shows from storage ${storage.name} have been scanned`,
            }));
    }

    scanEpisodesInShow (show: Media) {
        const getEpisodeFiles = TaskEither
            .tryCatch(
                () => this.prismaService.media.findUnique({
                    where: { id: show.id },
                    include: {
                        folder: {
                            include: {
                                cloudStorage: true,
                            },
                        },
                        videos: true,
                    },
                }),
                'Failed to retrieve show',
            )
            .nonNullable('Show not found')
            .chain((show) => TaskEither
                .of(show.folder)
                .nonNullable('Show folder not found')
                .chain((folder) => this.storageService.getRecursiveContents(folder.cloudStorage, folder.location))
                .map((files) => ({
                    videos: show.videos,
                    episodes: files,
                })));

        const deleteMissingVideos = getEpisodeFiles
            .chain(({ videos, episodes }) => TaskEither.of(videos)
                .difference(episodes, 'location', 'path'))
            .mapItems((video) => video.id)
            .chain((ids) => TaskEither
                .tryCatch(
                    () => this.prismaService.video.deleteMany({
                        where: {
                            id: {
                                'in': ids,
                            },
                        },
                    }),
                    'Failed to delete videos',
                ));

        const manageEpisodes = getEpisodeFiles
            .chain(({ videos, episodes }) => TaskEither
                .of(episodes).difference(videos, 'path', 'location'))
            .chain((files) => this.scanIdentifier.buildEpisodes(show, files));

        return manageEpisodes
            .executeSequentially((episode) => this.saveEpisode(show.id, episode))
            .matchTask([
                {
                    predicate: (episodes) => episodes.length === 0,
                    run: () => TaskEither.of({
                        message: `No episodes found for show ${show.name}`,
                    }),
                },
                {
                    predicate: () => true,
                    run: () => TaskEither
                        .tryCatch(
                            () => this.prismaService.media.update({
                                where: { id: show.id },
                                data: {
                                    updated: new Date(),
                                },
                            }),
                            'Failed to update show',
                        )
                        .map(() => ({
                            message: 'All episodes have been scanned',
                        })),
                },
            ])
            .chain(() => deleteMissingVideos)
            .map(() => ({
                message: 'All episodes have been scanned',
            }));
    }

    getStorages () {
        const countUnScannedMedia = (storage: CloudStorage) => TaskEither
            .all(
                this.getUnScannedMovies(storage),
                this.getUnScannedShows(storage),
            )
            .map(([movies, shows]) => ({
                movies: movies.length,
                shows: shows.length,
            }));

        return TaskEither
            .tryCatch(
                () => this.prismaService.cloudStorage.findMany({
                    include: {
                        user: true,
                        _count: {
                            select: {
                                folders: true,
                                videos: {
                                    where: {
                                        media: {
                                            type: MediaType.MOVIE,
                                        },
                                    },
                                },
                            },
                        },
                    },
                }),
                'Failed to retrieve cloud storages',
            )
            .chainItems((storage) => countUnScannedMedia(storage)
                .map((unScanned): StorageDetailSchema => ({
                    name: storage.name,
                    storageId: storage.id,
                    storageType: storage.drive,
                    shows: storage._count.folders,
                    movies: storage._count.videos,
                    owner: storage.user?.username ?? 'Unknown',
                    hasMovieLocations: storage.movieLocations.length > 0,
                    hasShowLocations: storage.showLocations.length > 0,
                    unScannedMovies: unScanned.movies,
                    unScannedShows: unScanned.shows,
                })));
    }

    getUnScannedItems (pagination: UnScannedArgs) {
        const buildItem = ({ file, type, storage }: { file: FramesFile, name: string, type: MediaType, storage: CloudStorage & { user: User } }) => this
            .scanIdentifier
            .getMediaInfo(file, type)
            .chain((item) => this.scanIdentifier.buildFromTmdbId(item.tmdbId, type, file)
                .map((media): UnScannedItemSchema => ({
                    name: media.name,
                    tmdbId: media.tmdbId,
                    type: media.type,
                    poster: null,
                    year: item.year,
                    posterBlur: null,
                    filename: file.name,
                    storageId: storage.id,
                    storageName: storage.name,
                    owner: storage.user.username,
                    filepath: file.path,
                }))
                .orElse(() => TaskEither.of({
                    name: item.name,
                    tmdbId: item.tmdbId,
                    type: item.type,
                    poster: null,
                    year: item.year,
                    posterBlur: null,
                    filename: file.name,
                    storageId: storage.id,
                    storageName: storage.name,
                    owner: storage.user.username,
                    filepath: file.path,
                })))
            .orElse(() => TaskEither.of({
                name: file.name,
                tmdbId: 0,
                type,
                poster: null,
                year: new Date().getFullYear(),
                posterBlur: null,
                filename: file.name,
                storageId: storage.id,
                storageName: storage.name,
                owner: storage.user.username,
                filepath: file.path,
            }));

        const getItems = (storage: CloudStorage & { user: User }) => TaskEither
            .all(
                this.getUnScannedMovies(storage)
                    .mapItems((file) => ({
                        storage,
                        name: file.name,
                        file: file as FramesFile,
                        type: MediaType.MOVIE as MediaType,
                    })),
                this.getUnScannedShows(storage)
                    .mapItems((file) => ({
                        file,
                        storage,
                        name: file.name,
                        type: MediaType.SHOW,
                    })),
            )
            .map(([movies, shows]) => [...movies, ...shows]);

        const calculatePages = <T extends { name: string }, U> (handler: (item: T) => TaskEither<U>) => (items: T[]) => {
            const pages = Math.ceil(items.length / pagination.pageSize);
            const offset = (pagination.page - 1) * pagination.pageSize;
            const paginatedItems = items
                .filter((item) => item.name.toLowerCase().includes(pagination.search.toLowerCase()))
                .slice(offset, offset + pagination.pageSize);

            return TaskEither
                .of(paginatedItems)
                .chainItems(handler)
                .map((total): PageResponse<U> => ({
                    results: total,
                    totalPages: pages,
                    page: pagination.page,
                    totalResults: items.length,
                }));
        };

        return TaskEither
            .tryCatch(
                () => this.prismaService.cloudStorage.findMany({
                    include: {
                        user: true,
                    },
                }),
                'Failed to retrieve cloud storages',
            )
            .chainItems(getItems)
            .map((items) => items.flat())
            .sortBy('name', 'asc')
            .chain(calculatePages(buildItem));
    }

    createNewMedia (params: CreateMediaArgs) {
        return this.storageService.getFile(params.storageId, params.filepath)
            .chain((file) => this.scanIdentifier.createNewMedia(params, file))
            .matchTask([
                {
                    predicate: (media) => media.type === MediaType.MOVIE,
                    run: (movie) => this.saveMovie(movie),
                },
                {
                    predicate: (media) => media.type === MediaType.SHOW,
                    run: (show) => this.saveShow(show).map((show) => show.id),
                },
            ])
            .map(() => ({
                message: 'Media has been created',
            }));
    }

    private getUnScannedMovies (storage: CloudStorage) {
        const deleteMissingVideos = (videos: Video[]) => (files: FramesFile[]) => TaskEither
            .of(difference(videos, files, 'location', 'path'))
            .mapItems((video) => video.id)
            .chain((ids) => TaskEither
                .tryCatch(
                    () => this.prismaService.media.deleteMany({
                        where: {
                            type: MediaType.MOVIE,
                            videos: {
                                some: {
                                    id: {
                                        'in': ids,
                                    },
                                    cloudStorageId: storage.id,
                                },
                            },
                        },
                    }),
                    'Failed to delete videos',
                ))
            .map(() => files);

        return TaskEither
            .tryCatch(
                () => this.prismaService.video.findMany({
                    where: {
                        media: {
                            type: MediaType.MOVIE,
                        },
                        cloudStorageId: storage.id,
                    },
                }),
            )
            .chain((videos) => TaskEither
                .of(storage.movieLocations)
                .chainItems((location) => this.storageService.getRecursiveContents(storage, location))
                .map((files) => files.flat())
                .chain(deleteMissingVideos(videos))
                .difference(videos, 'path', 'location'));
    }

    private getUnScannedShows (storage: CloudStorage) {
        const deleteMissingFolders = (folders: Folder[]) => (files: FramesFile[]) => TaskEither
            .of(difference(folders, files, 'location', 'path'))
            .mapItems((folder) => folder.id)
            .chain((ids) => TaskEither
                .tryCatch(
                    () => this.prismaService.media.deleteMany({
                        where: {
                            type: MediaType.SHOW,
                            folder: {
                                id: {
                                    'in': ids,
                                },
                                cloudStorageId: storage.id,
                            },
                        },
                    }),
                    'Failed to delete folders',
                ))
            .map(() => files);

        return TaskEither
            .tryCatch(
                () => this.prismaService.folder.findMany({
                    where: {
                        cloudStorageId: storage.id,
                    },
                }),
            )
            .chain((folders) => TaskEither
                .of(storage.showLocations)
                .filter(
                    (locations) => locations.length > 0,
                    () => createBadRequestError('No show locations found'),
                )
                .chainItems((location) => this.storageService.getContents(storage, location))
                .map((files) => files.flat())
                .chain(deleteMissingFolders(folders))
                .difference(folders, 'path', 'location'));
    }

    private performMovieCheck (movie: ScanResult) {
        const manageVideo = (video: Video) => this
            .storageService
            .getObjectFromFolder(video)
            .filter(
                (file) => !file.isFolder,
                () => createInternalError('Video is not a file'),
            )
            .filter(
                (file) => file.size < movie.file.size,
                () => createInternalError('New file is of better quality'),
            )
            .filter(
                (file) => file.mimeType !== 'video/mp4',
                () => createInternalError('File is not a video'),
            )
            .map(() => video)
            .orElse(() => TaskEither
                .tryCatch(
                    () => this.prismaService.video.update({
                        where: { id: video.id },
                        data: {
                            location: movie.file.path,
                            artworks: {
                                deleteMany: {},
                            },
                        },
                    }),
                    'Failed to create video',
                ));

        return TaskEither
            .tryCatch(
                () => this.prismaService.media.findUnique({
                    where: {
                        tmdbId_type: {
                            tmdbId: movie.tmdbId,
                            type: movie.type,
                        },
                    },
                    include: {
                        videos: true,
                    },
                }),
                'Failed to find movie',
            )
            .matchTask([
                {
                    predicate: (movie) => movie === null,
                    run: () => TaskEither.error(createBadRequestError('Movie not found')),
                },
                {
                    predicate: (movie) => movie !== null && movie.videos.length !== 1,
                    run: () => TaskEither.error(createBadRequestError('Movie video not found')),
                },
                {
                    predicate: (movie) => movie !== null && movie.videos.length === 1,
                    run: (movie) => manageVideo(movie!.videos[0]),
                },
            ])
            .flip(
                () => movie,
                () => createBadRequestError('Movie already exists'),
            );
    }

    private performShowCheck (show: ScanResult) {
        const manageFolder = (folder: Folder) => this
            .storageService
            .getObjectFromFolder(folder)
            .filter(
                (folderFile) => folderFile.isFolder,
                () => createInternalError('Folder is not a folder'),
            )
            .map(() => folder)
            .orElse(() => TaskEither
                .tryCatch(
                    () => this.prismaService.folder.update({
                        where: { id: folder.id },
                        data: { location: show.file.path },
                    }),
                    'Failed to update folder',
                ));

        return TaskEither
            .tryCatch(
                () => this.prismaService.media.findUnique({
                    where: {
                        tmdbId_type: {
                            tmdbId: show.tmdbId,
                            type: show.type,
                        },
                    },
                    include: {
                        folder: true,
                    },
                }),
                'Failed to find show',
            )
            .matchTask([
                {
                    predicate: (show) => show === null,
                    run: () => TaskEither.error(createBadRequestError('Show not found')),
                },
                {
                    predicate: (show) => show !== null && show.folder === null,
                    run: () => TaskEither.error(createBadRequestError('Show folder not found')),
                },
                {
                    predicate: (show) => show !== null && show.folder !== null,
                    run: (show) => manageFolder(show!.folder!),
                },
            ])
            .flip(
                () => show,
                () => createBadRequestError('Show already exists'),
            );
    }

    private saveMovie (movie: ScanResult) {
        return this.performMovieCheck(movie)
            .chain((movie) => this
                .openSubtitles
                .search({
                    imdbid: movie.imdbId,
                    filesize: movie.file.size,
                    filename: movie.file.name,
                }))
            .chain((subs) => TaskEither
                .tryCatch(
                    () => this.prismaService.media.create({
                        data: {
                            name: movie.name,
                            tmdbId: movie.tmdbId,
                            type: movie.type,
                            backdrop: movie.images.backdrop,
                            poster: movie.images.poster,
                            logo: movie.images.logo,
                            genres: movie.genres,
                            releaseDate: movie.releaseDate,
                            backdropBlur: movie.images.backdropAvgColor,
                            posterBlur: movie.images.posterAvgColor,
                            logoBlur: movie.images.logoAvgColor,
                            portrait: movie.images.portrait,
                            portraitBlur: movie.images.portraitAvgColor,
                            credits: {
                                createMany: {
                                    data: movie.credits,
                                },
                            },
                            videos: {
                                create: {
                                    location: movie.file.path,
                                    cloudStorageId: movie.file.cloudStorageId,
                                    subtitles: {
                                        createMany: {
                                            data: subs,
                                        },
                                    },
                                },
                            },
                            companies: {
                                create: movie.companies.map((company) => ({
                                    company: {
                                        connectOrCreate: {
                                            where: {
                                                companyType: {
                                                    tmdbId: company.tmdbId,
                                                    type: company.type,
                                                },
                                            },
                                            create: {
                                                ...company,
                                            },
                                        },
                                    },
                                })),
                            },
                        },
                        include: {
                            videos: true,
                        },
                    }),
                    'Failed to save movie',
                ))
            .map((movie) => movie.id)
            .chain((movieId) => this.llmService.saveMediaEmbed(movie, movieId));
    }

    private saveShow (show: ScanResult) {
        return this.performShowCheck(show)
            .chain((show) => TaskEither
                .tryCatch(
                    () => this.prismaService.media.create({
                        data: {
                            name: show.name,
                            tmdbId: show.tmdbId,
                            type: show.type,
                            backdrop: show.images.backdrop,
                            poster: show.images.poster,
                            logo: show.images.logo,
                            genres: show.genres,
                            releaseDate: show.releaseDate,
                            backdropBlur: show.images.backdropAvgColor,
                            posterBlur: show.images.posterAvgColor,
                            logoBlur: show.images.logoAvgColor,
                            portrait: show.images.portrait,
                            portraitBlur: show.images.portraitAvgColor,
                            credits: {
                                createMany: {
                                    data: show.credits,
                                },
                            },
                            folder: {
                                create: {
                                    location: show.file.path,
                                    cloudStorageId: show.file.cloudStorageId,
                                },
                            },
                            companies: {
                                create: show.companies.map((company) => ({
                                    company: {
                                        connectOrCreate: {
                                            where: {
                                                companyType: {
                                                    tmdbId: company.tmdbId,
                                                    type: company.type,
                                                },
                                            },
                                            create: {
                                                ...company,
                                            },
                                        },
                                    },
                                })),
                            },
                        },
                    }),
                    'Failed to save show',
                ))
            .chain((savedShow) => this.llmService.saveMediaEmbed(show, savedShow.id)
                .chain(() => this.scanEpisodesInShow(savedShow))
                .map(() => savedShow));
    }

    private saveEpisode (showId: string, episode: ScanEpisodeResult) {
        return this.openSubtitles.search({
            imdbid: episode.imdbId,
            filesize: episode.file.size,
            filename: episode.file.name,
            season: episode.season,
            episode: episode.episode,
        })
            .chain((subs) => TaskEither
                .tryCatch(
                    () => this.prismaService.video.create({
                        data: {
                            mediaId: showId,
                            location: episode.file.path,
                            cloudStorageId: episode.file.cloudStorageId,
                            subtitles: {
                                createMany: {
                                    data: subs,
                                },
                            },
                            episode: {
                                create: {
                                    season: episode.season,
                                    episode: episode.episode,
                                    showId,
                                },
                            },
                        },
                    }),
                    'Failed to save episode',
                ));
    }

    @OnEvent(EPISODES_CHANGED_EVENT)
    private addEpisodesToScanQueue (show: Media) {
        return TaskEither
            .tryCatch(
                () => this.scanQueue.add(show.name, new NewEpisodesEvent(show)),
                'Failed to add episodes scan job',
            );
    }

    private addLibraryToScanQueue (library: CloudStorage, type: LibraryScanType) {
        return TaskEither
            .tryCatch(
                () => this.scanQueue.add(library.name, new ScanLibraryEvent(library, type)),
                'Failed to add library scan job',
            );
    }
}
