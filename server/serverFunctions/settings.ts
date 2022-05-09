import {NextApiRequest, NextApiResponse} from "next";
import {ListEditors, Playlist} from "../classes/listEditors";
import {Modify} from "../classes/modify";

const list = new ListEditors();
const modify = new Modify();
const playlist = new Playlist();

export default async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
    let response: any;
    const type = req.query.type[1];
    const body = {...req.body, ...req.query, type: req.query.type[2] || req.body.type};

    switch (type) {
        case 'getSections':
            const otherArray = ['about', 'account'];
            response = await modify.userIsAdmin(userId) ? [...otherArray, 'manage'] : otherArray;
            break;

        case 'getManage':
            response = await modify.getManage(userId);
            break;

        case 'libUnScanned':
            response = await modify.getUnScanned(userId);
            break;

        case 'libSearch':
            response = await modify.searchLib(body.value);
            break;

        case 'getPicks':
            response = await list.getPicks();
            break;

        case 'getPlaylists':
            response = await playlist.getAllPlaylists(userId);
            break;

        case 'getPlaylist':
            response = await playlist.getPlaylist(body.identifier, userId);
            break;

        case 'getVideosForMedia':
            response = await playlist.getVideosForMedia(+body.mediaId);
            break;

       case 'getVideoForPlaylist':
            response = await playlist.getVideoForPlaylist(+body.videoId);
            break;

        case 'outSearch':
            response = await modify.totalSearch(body.value);
            break;

        case 'download':
            const downBool = body.value === 'media';
            downBool ? await modify.getNewContent(userId) : await modify.getMissingEpisodes(userId);
            response = true;
            break;
    }

    res.status(200).json(response);
}