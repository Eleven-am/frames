import {NextApiResponse} from "next";
import {GoogleCred, GoogleToken} from "../lib/environment";
import {drive_v2, drive_v3, google} from "googleapis";

export default class DriveHandler {
    private readonly drive2: drive_v2.Drive;
    private readonly drive: drive_v3.Drive;
    private readonly deleteAndRename: boolean;

    constructor(token: GoogleToken | null, credentials: GoogleCred | null, deleteAndRename: boolean) {
        if (token && credentials) {
            const {client_secret, client_id, redirect_uris} = credentials;
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
            oAuth2Client.setCredentials(token);
            const auth = oAuth2Client;
            this.drive = google.drive({version: 'v3', auth});
            this.drive2 = google.drive({version: 'v2', auth});
            this.deleteAndRename = deleteAndRename;
        } else
            throw new Error('Incorrect google config')
    }

    /**
     * @desc gets every file in a google drive folder
     * @param folder - the folder to get the files from
     * @param pageToken - the page token to get the next page of files
     * @param trashed - if the files should be trashed or not
     */
    readFolder = async (folder: string, trashed = 'false', pageToken?: string): Promise<drive_v3.Schema$File[]> => {
        pageToken = pageToken || "";
        let res = await this.drive.files.list({
            q: `'${folder}' in parents and trashed = ${trashed}`,
            fields: 'nextPageToken, files(id, name, size, mimeType, trashed, parents)',
            spaces: 'drive',
            orderBy: 'name',
            pageSize: 1000,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
            pageToken: pageToken
        });

        let files = res.data.files || [];
        let temp = !!res.data.nextPageToken ? await this.readFolder(folder, trashed, res.data.nextPageToken) : [];
        return files.concat(temp);
    }

    /**
     * @desc gets a specific file by name from a specific google drive folder
     * @param fileName - name of file to find
     * @param folder - the folder to get the file from
     */
    findFile = async (fileName: string, folder: string): Promise<drive_v3.Schema$File | false> => {
        let res = await this.drive.files.list({
            q: `'${folder}' in parents and trashed = false and name = "${fileName}"`,
            fields: 'files(id, name, size, mimeType)',
            spaces: 'drive',
            orderBy: 'name',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
            pageSize: 10
        });

        let files = res.data.files || [];
        return files.length > 0 ? files[0] : false;
    }

    /**
     * @desc builds a video header based on specific data requested by the user
     * @param range - HTTP request range to be requested
     * @param video - the video to build the header for
     */
    buildRange = (range: string, video: drive_v3.Schema$File) => {
        let videoRes = {
            mimeType: '',
            fileSize: 0,
            start: 0,
            end: 0,
            chunkSize: 0
        };
        videoRes.mimeType = video.mimeType!;
        videoRes.fileSize = parseInt(video.size!, 10);
        const parts = range
            .replace(/bytes=/, "")
            .split("-")

        videoRes.start = parseInt(parts[0], 10)
        videoRes.end = parseInt(parts[1]) > 0 ? parseInt(parts[1], 10) : videoRes.fileSize - 1
        videoRes.chunkSize = (videoRes.end - videoRes.start) + 1;

        return videoRes;
    }

    /**
     * @desc gets a google drive file's metadata
     * @param fileId - id for file to be requested
     */
    getFile = async (fileId: string): Promise<drive_v3.Schema$File | null> => {
        return new Promise(resolve => {
            this.drive.files.get({
                fileId: fileId,
                supportsAllDrives: true,
                fields: "id, name, size, parents, mimeType, contentHints/thumbnail, videoMediaMetadata, thumbnailLink, explicitlyTrashed"
            }).then(response => resolve(response.data))
                .catch(() => resolve(null))
        })
    }

    /**
     * @desc deletes a google drive file using it's file_id
     * @param fileId - id for file to be deleted
     */
    deleteFile = async (fileId: string) => {
        if (this.deleteAndRename)
            return (await this.drive.files.update({fileId, requestBody: {trashed: true}})).status === 200;
        else return false;
    }

    /**
     * @desc gets every file in a Google Drive folder and sub-folders
     * @param folderId
     */
    recursiveReadFolder = async (folderId: string) => {
        const res = await this.readFolder(folderId);
        let files = res.filter(file => file.mimeType !== 'application/vnd.google-apps.folder');
        const folders = res.filter(file => file.mimeType === 'application/vnd.google-apps.folder');

        for await (let folder of folders)
            files = files.concat(await this.recursiveReadFolder(folder.id!));

        return files;
    }

    /**
     * @desc returns a 206 morsel response of a video based on the range requested
     * @param id - id of file tp be requested
     * @param dest - destination for stream buffer outbound stream
     * @param range - HTTP request range requested
     */
    streamFile = async (id: string, dest: NextApiResponse, range: string) => {
        const file = await this.getFile(id);
        if (file){
            let {start, end, chunkSize, fileSize, mimeType} = this.buildRange(range, file);
            dest.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': mimeType
            })

            let {data} = await this.drive.files.get({
                fileId: id,
                alt: 'media',
                supportsAllDrives: true,
            }, {responseType: 'stream', headers: {Range: `bytes=${start}-${end}`}});

            data.pipe(dest);

        } else dest.status(404).json('file no longer exists');
    }

    /**
     * @desc moves an element by its google id to the Google folder by its folder id
     * @param element - element to be moved
     * @param folder_id - id of folder to move element to
     */
    moveElement = async (element: string, folder_id: string) => {
        let file = await this.drive.files.get({
            fileId: element,
            fields: 'parents',
            supportsAllDrives: true
        });

        if (file && file.data && file.data.parents){
            let parent = file.data.parents.join(',');
            if (parent !== folder_id) {
                await this.drive.files.update({
                    fileId: element,
                    addParents: folder_id,
                    removeParents: parent,
                    supportsAllDrives: true,
                    fields: 'id, parents'
                })
            }
        }
    }

    /**
     * @desc Restores previously deleted element from trash
     * @param fileId - id of file to be restored
     */
    restoreFile = async (fileId: string): Promise<boolean> => {
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

    /**
     * @desc downloads a file from Google Drive to user
     * @param file_id - id of file to be downloaded
     * @param name - name of file to be downloaded
     * @param dest - destination for download outbound stream
     */
    rawDownload = async (file_id: string, name: string, dest: NextApiResponse) => {
        const file = await this.getFile(file_id);
        if (file){
            let value = 'attachment; filename=' + name + ' [frames].mp4';
            let {data} = await this.drive.files.get({
                fileId: file_id,
                alt: 'media',
                supportsAllDrives: true,
            }, {responseType: 'stream'});

            dest.setHeader('Content-disposition', value);
            dest.setHeader('Content-type', file.mimeType!);
            data.pipe(dest);

        } else dest.status(404).json('file no longer exists');
    }

    /**
     * @desc renames a file / folder
     * @param fileId - id of file to be renamed
     * @param name - new name for file
     */
    renameFile = async (fileId: string, name: string) => {
        if (this.deleteAndRename)
        { // @ts-ignore
            return await this.drive.files.update({
                'fileId': fileId,
                'resource': {name},
                'supportsAllDrives': true,
            })
        }
        else return false;
    }

    /**
     * @desc creates a folder with the specified name
     * @param name - name of folder to be created
     * @param parent - id of parent folder
     */
    createFolder = async (name: string, parent: string) => {
        const fileMetadata = {
            'name': name,
            'mimeType': 'application/vnd.google-apps.folder'
        }

        return new Promise<string>(resolve => {
            this.drive.files.create({
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
     * Print information about the current user along with the Drive API
     * settings.
     */
    printAbout = async () => {
        let resp: any = await this.drive2.about.get();
        resp = resp.data;
        console.log('Current user name: ' + resp.name);
        console.log('Root folder ID: ' + resp.rootFolderId);
        console.log('Total quota (bytes): ' + resp.quotaBytesTotal);
        console.log('Used quota (bytes): ' + resp.quotaBytesUsed);
    }

    /**
     * @dest a beta stream function that handles HLS adaptive streaming
     * @param filename - name of file requested
     * @param folder - folder id of file requested
     * @param dest - destination for download outbound stream
     */
    hlsStream = async (filename: string, folder: string, dest: NextApiResponse) => {
        let file = await this.findFile(filename, folder);
        if (file) {
            let {id, mimeType} = file;
            let {data} = await this.drive.files.get({
                fileId: id!,
                alt: 'media',
                supportsAllDrives: true,
            }, {responseType: 'stream'});

            dest.setHeader('Content-type', mimeType!);
            data.pipe(dest);
        }
    }
}