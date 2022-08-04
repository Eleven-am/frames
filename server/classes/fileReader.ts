import {regrouped, Regrouped} from "../lib/environment";

export interface FileOrFolder {
    name: string;
    isFolder: boolean;
    location: string;
    mimeType: string;
    size: number;
    parent: string[];
}

export type Header206 = { chunkSize: number, fileSize: number, start: number, end: number, mimeType: string };

export enum ServiceType {
    ONEDRIVE,
    GOOGLE_DRIVE,
    DROPBOX,
    BOX,
    FILESERVER
}

export default abstract class FileReader {
    protected serviceType: ServiceType;
    protected deleteAndMove: boolean;
    protected readonly regrouped: Regrouped;

    protected constructor(serviceType: ServiceType) {
        this.serviceType = serviceType;
        this.deleteAndMove = regrouped.user?.deleteAndRename || false;
        this.regrouped = regrouped;
    }

    public abstract getFile(path: string): Promise<FileOrFolder | null>;

    public abstract readFolder(path: string, pageToken?: string): Promise<FileOrFolder[]>;

    public abstract recursiveReadFolder(path: string): Promise<FileOrFolder[]>;

    public abstract streamFile(path: string, range: string): Promise<{ stream: NodeJS.ReadableStream, headers: Header206 } | null>;

    public abstract moveFileOrFolder(path: string, newPath: string): Promise<boolean>;

    public abstract deleteFileOrFolder(path: string): Promise<boolean>;

    public abstract createFolder(path: string, name: string): Promise<string>;

    public abstract renameFileOrFolder(path: string, newName: string): Promise<void>;

    public abstract buildRange(range: string, file: FileOrFolder): Header206;

    public abstract downloadFile(path: string): Promise<NodeJS.ReadableStream | null>;

    protected getServiceType(): ServiceType {
        return this.serviceType;
    }
}