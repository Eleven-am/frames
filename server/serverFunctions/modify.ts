import {NextApiRequest, NextApiResponse} from "next";
import {Modify} from "../classes/modify";
import {Aggregate} from "../classes/tmdb";
import {regrouped} from "../lib/environment";
import {ListEditors, Playlist} from "../classes/listEditors";
import Magnet from "../classes/deluge";
const modify = new Modify();
const listEditor = new ListEditors();
const playlist = new Playlist();
const deluge = new Magnet();
const aggregate = new Aggregate(regrouped.tmdbToken!);

export default async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
    let response: any;
    const type = req.query.type[1];
    const body = {...req.body, ...req.query, type: req.query.type[2] || req.body.type};

    switch (type) {
        case 'modifyMedia':
            response = await modify.modifyMedia(userId, body.media);
            break;

        case 'getMedia':
            response = await modify.getMediaForMod(userId, +body.mediaId);
            break;

        case 'checkMedia':
            response = await modify.checkIfMediaExists(body.tmdbId, body.type);
            break;

        case 'getImages':
            response = await aggregate.getImages(body.tmdbId, body.name, body.type, body.year);
            break;

        case 'getMediaInfo':
            response = await aggregate.getMedia(body.tmdbId, body.type);
            break;

        case 'searchMedia':
            response = await modify.searchForMedia(body.query, body.type);
            break;

        case 'getEpisodes':
            response = await modify.getEpisodes(+body.mediaId, userId);
            break;

        case 'modifyEpisode':
            response = await modify.modifyEpisode(userId, body.episode);
            break;

        case 'scanSubs':
            response = await modify.scanSubs(userId, +body.mediaId);
            break;

        case 'scanEpisodes':
            await modify.scanShow(+body.mediaId, body.thorough, !body.thorough);
            response = true;
            break;

        case 'scanAllMedia':
            await modify.autoScan();
            response = true;
            break;

        case 'scanAllSubs':
            await modify.scanAllSubs();
            response = true;
            break;

        case 'scanAllEpisodes':
            await modify.scanAllEpisodes(false, true);
            response = true;
            break;

        case 'pick':
            await listEditor.addPick(body.picks, body.category, body.display, body.type, body.active);
            response = true;
            break;

        case 'recommend':
            response = await modify.getRecommended(body.tmdbId, body.type);
            break;

        case 'download':
            const downRes = await deluge.addMagnet(body.tmdbId, body.type);
            response = !!downRes;
            break;

        case 'watchHistory':
            response = await modify.getWatchHistory(userId, +req.query.page, +req.query.limit);
            break;

        case 'myList':
            response = await modify.getMyList(userId, +req.query.page, +req.query.limit);
            break;

        case 'addToPlaylist':
            response = await playlist.addToPlayList(userId, body.identifier, body.videos);
            break;

        case 'createPlaylist':
            response = await playlist.createPlaylist(userId, body.videos, body.name, body.overview, body.isPublic, body.identifier);
            break;

        case 'deletePlaylist':
            response = await playlist.deletePlaylist(userId, body.identifier);
            break;
    }

    res.status(200).json(response);
}