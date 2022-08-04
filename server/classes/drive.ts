import fetch from 'cross-fetch';
import {GoogleCred, GoogleToken} from "../lib/environment";
import {drive_v2, drive_v3, google} from "googleapis";
import FileReader, {FileOrFolder, Header206, ServiceType} from "./fileReader";

export default class Drive extends FileReader {
    private readonly drive2: drive_v2.Drive;
    private readonly drive3: drive_v3.Drive;
    private readonly token: GoogleToken;
    private readonly credentials: GoogleCred;

    constructor() {
        super(ServiceType.GOOGLE_DRIVE);
        if (this.regrouped.token && this.regrouped.credentials) {
            this.token = this.regrouped.token;
            this.credentials = this.regrouped.credentials;
            const {client_secret, client_id, redirect_uris} = this.credentials;
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
            oAuth2Client.setCredentials(this.token);
            const auth = oAuth2Client;
            this.drive3 = google.drive({version: 'v3', auth});
            this.drive2 = google.drive({version: 'v2', auth});

        } else
            throw new Error('No token or credentials found');
    }

    /**
     * @desc returns a file from Google Drive
     * @param file - id of file to be requested
     */
    private static parseFile(file: drive_v3.Schema$File): FileOrFolder {
        return {
            location: file.id!,
            name: file.name!,
            size: +file.size!,
            parent: file.parents!,
            mimeType: file.mimeType!,
            isFolder: file.mimeType === 'application/vnd.google-apps.folder',
        }
    }

    /**
     * @desc gets a google drive file's metadata
     * @param fileId - id for file to be requested
     */
    public async getFile(fileId: string) {
        const file = await this.drive3.files.get({
            fileId: fileId,
            supportsAllDrives: true,
            fields: "id, name, size, parents, mimeType, contentHints/thumbnail, videoMediaMetadata, thumbnailLink, explicitlyTrashed"
        });

        if (file.data)
            return Drive.parseFile(file.data);

        return null;
    }

    /**
     * @desc gets every file in a Google Drive folder
     * @param folder - the folder to get the files from
     * @param pageToken - the page token to get the next page of files
     */
    public async readFolder(folder: string, pageToken?: string): Promise<FileOrFolder[]> {
        pageToken = pageToken || "";
        let res = await this.drive3.files.list({
            q: `'${folder}' in parents and trashed = false`,
            fields: 'nextPageToken, files(id, name, size, mimeType, trashed, parents)',
            spaces: 'drive',
            orderBy: 'name',
            pageSize: 1000,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
            pageToken: pageToken
        });

        let files = res.data.files || [];
        let data = files.map(file => Drive.parseFile(file));
        let temp = !!res.data.nextPageToken ? await this.readFolder(folder, res.data.nextPageToken) : [];
        return data.concat(temp);
    }

    /**
     * @desc gets every file in a Google Drive folder and sub-folders
     * @param folderId
     */
    public async recursiveReadFolder(folderId: string): Promise<FileOrFolder[]> {
        let items = await this.readFolder(folderId);
        let folders = items.filter(item => item.isFolder);
        let files = items.filter(item => !item.isFolder);
        let promises = folders.map(folder => this.recursiveReadFolder(folder.location));
        let data = await Promise.all(promises);
        return files.concat(...data);
    }

    /**
     * @desc renames a file / folder
     * @param fileId - id of file to be renamed
     * @param name - new name for file
     */
    public async renameFileOrFolder(fileId: string, name: string) {
        // @ts-ignore
        this.deleteAndMove && await this.drive3.files.update({
            fileId: fileId,
            supportsAllDrives: true,
            fields: "id, name, size, parents, mimeType, contentHints/thumbnail, videoMediaMetadata, thumbnailLink, explicitlyTrashed",
            resource: {
                name: name
            }
        });
    }

    /**
     * @desc moves an element by its google id to the Google folder by its folder id
     * @param element - element to be moved
     * @param folder_id - id of folder to move element to
     */
    public async moveFileOrFolder(element: string, folder_id: string) {
        let file = await this.drive3.files.get({
            fileId: element,
            fields: 'parents',
            supportsAllDrives: true
        });

        if (file && file.data && file.data.parents) {
            let parent = file.data.parents.join(',');
            if (parent !== folder_id) {
                await this.drive3.files.update({
                    fileId: element,
                    addParents: folder_id,
                    removeParents: parent,
                    supportsAllDrives: true,
                    fields: 'id, parents'
                })

                return true;
            }
        }

        return false;
    }

    /**
     * @desc builds a video header based on specific data requested by the user
     * @param range - HTTP request range to be requested
     * @param file - the video to build the header for
     */
    public buildRange(range: string, file: FileOrFolder) {
        let videoRes = {
            mimeType: '',
            fileSize: 0,
            start: 0,
            end: 0,
            chunkSize: 0
        };

        videoRes.mimeType = file.mimeType;
        videoRes.fileSize = file.size;
        const parts = range
            .replace(/bytes=/, "")
            .split("-");

        videoRes.start = parseInt(parts[0], 10);
        videoRes.end = parseInt(parts[1]) > 0 ? parseInt(parts[1], 10) : videoRes.fileSize - 1;
        videoRes.chunkSize = videoRes.end - videoRes.start + 1;
        return videoRes;
    }

    /**
     * @desc creates a folder with the specified name
     * @param name - name of folder to be created
     * @param path - id of parent folder
     */
    public async createFolder(path: string, name: string): Promise<string> {
        const fileMetadata = {
            'name': name,
            'mimeType': 'application/vnd.google-apps.folder'
        }

        return new Promise<string>(resolve => {
            this.drive3.files.create({
                // @ts-ignore
                resource: fileMetadata,
                fields: 'id',
                parents: parent,
                supportsAllDrives: true,
            }, (err: any, file: { data: { id: string | PromiseLike<string>; }; }) => {
                if (err) {
                    console.warn(err);
                    resolve('');
                } else {
                    resolve(file.data.id);
                }
            });
        })
    }

    /**
     * @desc deletes a google drive file using it's file_id
     * @param fileId - id for file to be deleted
     */
    public async deleteFileOrFolder(fileId: string): Promise<boolean> {
        if (this.deleteAndMove)
            return (await this.drive3.files.update({fileId, requestBody: {trashed: true}})).status === 200;
        else return false;
    }

    /**
     * @desc downloads a file from Google Drive to user
     * @param file_id - id of file to be downloaded
     */
    public async downloadFile(file_id: string): Promise<NodeJS.ReadableStream | null> {
        const file = await this.getFile(file_id);
        if (file === null || file.isFolder) return null;

        let {data} = await this.drive3.files.get({
            fileId: file_id,
            alt: 'media',
            supportsAllDrives: true,
        }, {responseType: 'stream'});

        return data;
    }

    /**
     * @desc returns a 206 morsel response of a video based on the range requested
     * @param fileId - id of file tp be requested
     * @param range - HTTP request range requested
     */
    public async streamFile(fileId: string, range: string): Promise<{ stream: NodeJS.ReadableStream, headers: Header206 } | null> {
        const file = await this.getFile(fileId);
        if (!file) return null;

        const videoRes = this.buildRange(range, file);
        let {data} = await this.drive3.files.get({
            fileId: fileId,
            alt: 'media',
            supportsAllDrives: true,
        }, {responseType: 'stream', headers: {Range: `bytes=${videoRes.start}-${videoRes.end}`}});

        return {stream: data, headers: videoRes}
    }

    /**
     * @desc returns an upload link for a file to be uploaded to Google Drive
     * @param name - name of file to be uploaded
     * @param parent - id of parent folder
     * @param mimeType - mime type of file to be uploaded
     */
    public async generateUploadUri(name: string, parent: string, mimeType: string): Promise<string> {
        const oauth2Client = new google.auth.OAuth2(this.credentials.client_id, this.credentials.client_secret);
        oauth2Client.setCredentials(this.token);
        const accessToken = await oauth2Client.getAccessToken() as string;

        const headers = {
            'authorization': `Bearer ${accessToken}`,
            'content-type': 'application/json'
        }

        const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id&supportsAllDrives=true`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name,
                mimeType,
                parents: [parent]
            })
        });
        const locationHeader = res.headers.get('location');
        if (!locationHeader) throw new Error('No location header');
        return locationHeader;
    }

    /**
     * @desc Restores previously deleted element from trash
     * @param fileId - id of file to be restored
     */
    protected async restoreFile(fileId: string) {
        return new Promise<boolean>(resolve => {
            this.drive2.files.untrash({'fileId': fileId})
                .then(resp => {
                    console.log(resp);
                    resolve(true);
                })
                .catch(err => {
                    console.warn(err);
                    resolve(false);
                });
        })
    }
}