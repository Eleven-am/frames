import { TaskEither, createBadRequestError } from '@eleven-am/fp';
import { EventEmitter } from 'events';
import * as fs from 'node:fs';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

interface FileItem {
    path: string;
    stat: fs.Stats;
}

interface Config {
    folders: string[];
    depth?: number;
    intervalMs?: number;
}

type WatcherEvents = 'addFile' | 'addFolder' | 'unlinkFile' | 'unlinkFolder';

export class FileWatcher extends EventEmitter {
    private videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', '.m4v'];
    private cache: Map<string, boolean>;
    private interval: NodeJS.Timeout | null;
    private readonly folders: string[];
    private readonly depth: number;
    private readonly intervalMs: number;

    constructor (config: Config) {
        super();
        this.folders = config.folders;
        this.depth = config.depth || 1;
        this.intervalMs = config.intervalMs || 1000;
        this.cache = new Map();
        this.interval = null;
    }

    watch () {
        void new Promise(async (resolve) => {
            await this.buildCache(this.folders);

            this.interval = setInterval(() => this.scanFolders(), this.intervalMs);
            resolve(null);
        })
    }

    /**
     * @desc Add a folder to watch
     * @param dir - folder path
     */
    add (dir: string) {
        this.folders.push(dir);
        void this.buildCache([dir]);
    }

    /**
     * @desc Stop watching folders
     */
    stop () {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    /**
     * @desc Add event listener
     * @param event - event name
     * @param listener - event listener
     */
    on (event: WatcherEvents, listener: (path: string) => void): this {
        return super.on(event, listener);
    }

    private scanDirectory (dir: string, depth: number): TaskEither<FileItem[]> {
        return TaskEither
            .of(depth)
            .filter(
                (depth) => depth > 0,
                () => createBadRequestError('Depth must be greater than 0')
            )
            .chain(
                () => TaskEither.tryCatch(
                    () => readdir(dir),
                    () => createBadRequestError('Error reading directory')
                )
            )
            .mapItems((item) => `${dir}/${item}`)
            .chainItems(
                (item) => TaskEither.tryCatch(
                    async (): Promise<FileItem> => ({
                        path: item,
                        stat: await stat(item)
                    }),
                    () => createBadRequestError('Error reading file')
                )
            )
            .chainItems((item) => TaskEither
                .of(item)
                .matchTask([
                    {
                        predicate: (item) => item.stat.isDirectory(),
                        run: (item) => this.scanDirectory(item.path, depth - 1)
                            .map((children) => [item, ...children])
                    },
                    {
                        predicate: (item) => item.stat.isFile(),
                        run: (item) => TaskEither.of([item])
                    }
                ])
            )
            .map((items) => items.flat())
            .orElse(() => TaskEither.of([]))
            .filterItems((item) => this.shouldWatch(item))
    }

    private scanFolders () {
        return TaskEither
            .of(this.folders)
            .chainItems((folder) => this.scanDirectory(folder, this.depth))
            .map((items) => items.flat())
            .map((items) => this.emitEvents(items))
            .toResult();
    }

    private emitEvents (items: FileItem[]) {
        const pathsSet = new Set(items.map((item) => item.path));
        const oldPathsSet = new Set(this.cache.keys());
        const newCache = this.toCache(items);

        for (const [path, isDirectory] of this.cache.entries()) {
            if (!pathsSet.has(path)) {
                const eventSuffix = isDirectory ? 'Folder' : 'File';
                this.emit(`unlink${eventSuffix}`, path);
            }
        }

        for (const [path, isDirectory] of newCache.entries()) {
            if (!oldPathsSet.has(path)) {
                const eventSuffix = isDirectory ? 'Folder' : 'File';
                this.emit(`add${eventSuffix}`, path);
            }
        }

        this.cache = newCache;
    }

    private shouldWatch(item: FileItem) {
        if (item.stat.isDirectory()) return true;

        const filename = item.path.toLowerCase();
        return this.videoExtensions.some(ext => filename.endsWith(ext));
    }

    private buildCache (folders: string[]) {
        return TaskEither
            .of(folders)
            .chainItems((folder) => this.scanDirectory(folder, this.depth))
            .map((items) => items.flat())
            .map((items) => this.mergeToCache(this.cache, items))
            .ioSync((cache) => {
                this.cache = cache;
            })
            .toResult();
    }

    private toCache (items: FileItem[]) {
        return items
            .reduce((cache, item) => cache.set(item.path, item.stat.isDirectory()), new Map<string, boolean>());
    }

    private mergeToCache (cache: Map<string, boolean>, items: FileItem[]) {
        const newCache = new Map(cache);
        const mappedCache = this.toCache(items);

        for (const [path, isDirectory] of mappedCache.entries()) {
            newCache.set(path, isDirectory);
        }

        return newCache;
    }
}
