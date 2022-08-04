import {NextApiRequest, NextApiResponse} from "next";
import MediaClass from "../classes/media";
import Playlist from "../classes/playlist";
import PickAndFrame from "../classes/pickAndFrame";
import Springboard from "../classes/springboard";
import User from "../classes/user";

const user = new User()
const springboard = new Springboard();
const playlist = new Playlist();
const media = new MediaClass();
const list = new PickAndFrame();

export default async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
    let response: any;
    const type = req.query.type[1];
    const body = {...req.body, ...req.query, type: req.query.type[2] || req.body.type};

    switch (type) {
        case 'getSections':
            const otherArray = ['about', 'account'];
            response = await user.isAdmin(userId) ? [...otherArray, 'manage'] : otherArray;
            break;

        case 'getManage':
            response = await springboard.getManage(userId);
            break;

        case 'libUnScanned':
            response = await springboard.getUnScanned(userId);
            break;

        case 'libSearch':
            response = await springboard.searchLib(body.value);
            break;

        case 'getPicks':
            response = await list.getPicks();
            break;

        case 'getPlaylists':
            const type = body.tab === 'playlists' ? 'PLAYLISTS' : body.tab === 'shared' ? 'SHARED' : 'PUBLIC';
            response = await playlist.getAllPlaylists(userId, type);
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

        case 'getVideoForPlayback':
            response = await playlist.getVideoForPlayback(+body.videoId, body.identifier);
            break;

        case 'outSearch':
            response = await springboard.totalSearch(body.value);
            break;

        case 'download':
            const downBool = body.value === 'media';
            downBool ? await media.getNewContent() : await media.getMissingEpisodes();
            response = true;
            break;
    }

    res.status(200).json(response);
}