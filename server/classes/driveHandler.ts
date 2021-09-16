import {NextApiResponse} from "next";
import environment from "../base/env";
import {drive_v2, drive_v3, google} from "googleapis";

export default class DriveHandler {
    private readonly drive2: drive_v2.Drive;
    private readonly drive: drive_v3.Drive;

    constructor() {
        if (environment.config.token){
            const {client_secret, client_id, redirect_uris} = environment.credentials.web;
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
            oAuth2Client.setCredentials(environment.config.token);
            const auth = oAuth2Client;
            this.drive = google.drive({version: 'v3', auth});
            this.drive2 = google.drive({version: 'v2', auth});
        } else
            throw new Error('Incorrect google config')
    }

    /**
     * @desc gets every file in a google drive folder
     * @param folder
     * @param pageToken
     * @param trashed
     */
    readFolder = async (folder: string, trashed = 'false', pageToken?: string): Promise<drive_v3.Schema$File[]> => {
        pageToken = pageToken || "";
        let res = await this.drive.files.list({
            q: `'${folder}' in parents and trashed = ${trashed}`,
            fields: 'nextPageToken, files(id, name, size, mimeType, trashed)',
            spaces: 'drive',
            orderBy: 'name',
            pageSize: 1000,
            pageToken: pageToken
        });

        let files = res.data.files || [];
        let temp = !!res.data.nextPageToken ? await this.readFolder(folder, trashed, res.data.nextPageToken) : [];
        return files.concat(temp);
    }

    /**
     * @desc gets a specific file by name from a specific google drive folder
     * @param fileName
     * @param folder
     */
    findFile = async (fileName: string, folder: string): Promise<drive_v3.Schema$File | false> => {
        let res = await this.drive.files.list({
            q: `'${folder}' in parents and trashed = false and name = "${fileName}"`,
            fields: 'files(id, name, size, mimeType)',
            spaces: 'drive',
            orderBy: 'name',
            pageSize: 10
        });

        let files = res.data.files || [];
        return files.length > 0 ? files[0] : false;
    }

    /**
     * @desc builds a video header based on specific data requested by the user
     * @param range
     * @param video
     */
    buildRange = (range: string, video: drive_v3.Schema$File) => {
        let videoRes: { mimeType: string, fileSize: number, start: number, end: number, chunkSize: number } = {
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
     * @param fileId
     * @returns {Promise<drive_v3.Schema$File>}
     */
    getFile = async (fileId: string): Promise<drive_v3.Schema$File | null> => {
        return new Promise(resolve => {
            this.drive.files.get({
                fileId: fileId,
                fields: "id, name, size, mimeType, contentHints/thumbnail, videoMediaMetadata, thumbnailLink, explicitlyTrashed"
            }).then(response => resolve(response.data))
                .catch(() => resolve(null))
        })
    }

    /**
     * @desc deletes a google drive file using it's file_id
     * @param fileId
     */
    deleteFile = async (fileId: string) => {
        if (environment.config.deleteAndRename)
            return (await this.drive.files.update({fileId, requestBody: {trashed: true}})).status === 200;
        else return false;
    }

    /**
     * @desc returns a 206 morceau response of a video based on the range requested
     * @param id
     * @param dest
     * @param range
     * @returns {Promise<void>}
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
            }, {responseType: 'stream', headers: {Range: `bytes=${start}-${end}`}});

            data.pipe(dest);

        } else dest.status(404).json('file no longer exists');
    }

    /**
     * @desc moves an element by it's google id to the google folder by it's folder id
     * @param element
     * @param folder_id
     * @returns {Promise<void>}
     */
    moveElement = async (element: string, folder_id: string) => {
        let file = await this.drive.files.get({
            fileId: element,
            fields: 'parents'
        });

        if (file && file.data && file.data.parents){
            let parent = file.data.parents.join(',');
            if (parent !== folder_id) {
                await this.drive.files.update({
                    fileId: element,
                    addParents: folder_id,
                    removeParents: parent,
                    fields: 'id, parents'
                })
            }
        }
    }

    /**
     * @desc Restores previously deleted element from trash
     * @param fileId
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
     * @desc downloads a file from google drive to user
     * @param file_id
     * @param name
     * @param dest
     * @returns {Promise<void>}
     */
    rawDownload = async (file_id: string, name: string, dest: NextApiResponse) => {
        // @ts-ignore
        let {mimeType} = await this.getFile(file_id);
        let value = 'attachment; filename=' + name + ' [frames].mp4';

        let {data} = await this.drive.files.get({
            fileId: file_id,
            alt: 'media'
        }, {responseType: 'stream'});

        dest.setHeader('Content-disposition', value);
        dest.setHeader('Content-type', mimeType);
        data.pipe(dest);
    }

    /**
     * @desc renames a file / folder
     * @param fileId
     * @param name
     * @returns {Promise<*>}
     */
    renameFile = async (fileId: string, name: string) => {
        if (environment.config.deleteAndRename)
        { // @ts-ignore
            return await this.drive.files.update({
                'fileId': fileId,
                'resource': {name}
            })
        }
        else return false;
    }

    /**
     * @desc creates a folder with the specified name
     * @param name
     * @returns {Promise<*>}
     */
    createFolder = async (name: string) => {
        const fileMetadata = {
            'name': name,
            'mimeType': 'application/vnd.google-apps.folder'
        }

        let res = await this.drive.files.create({
            // @ts-ignore
            resource: fileMetadata,
            fields: 'id'
        })

        return res.data.id;
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
     * @param filename
     * @param folder
     * @param dest
     * @returns {Promise<void>}
     */
    hlsStream = async (filename: string, folder: string, dest: NextApiResponse) => {
        let file = await this.findFile(filename, folder);
        if (file) {
            let {id, mimeType} = file;
            let {data} = await this.drive.files.get({
                fileId: id!,
                alt: 'media'
            }, {responseType: 'stream'});

            dest.setHeader('Content-type', mimeType!);
            data.pipe(dest);
        }
    }
}
