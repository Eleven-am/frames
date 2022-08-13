import {NextApiRequest, NextApiResponse} from "next";
import {Aggregate} from "../classes/tmdb";
import {regrouped} from "../lib/environment";
import Magnet from "../classes/deluge";
import Playlist from "../classes/playlist";
import User from "../classes/user";
import MediaClass from "../classes/media";
import PickAndFrame from "../classes/pickAndFrame";
import Springboard from "../classes/springboard";

const playlist = new Playlist();
const deluge = new Magnet();
const user = new User();
const listEditor = new PickAndFrame();
const modify = new Springboard();
const media = new MediaClass();
const aggregate = new Aggregate(regrouped.tmdbToken!);

export default async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
    let response: any;
    const type = req.query.type[1];
    const body = {...req.body, ...req.query, type: req.query.type[2] || req.body.type};

    switch (type) {
        case 'modifyMedia':
            response = await media.modifyMedia(userId, body.media);
            break;

        case 'getMedia':
            response = await media.getMediaForMod(+body.mediaId);
            break;

        case 'checkMedia':
            response = await media.checkIfMediaExists(body.tmdbId, body.type);
            break;

        case 'getImages':
            response = await aggregate.getImages(body.tmdbId, body.name, body.type, body.year);
            break;

        case 'getMediaInfo':
            response = await aggregate.getMedia(body.tmdbId, body.type);
            break;

        case 'searchMedia':
            response = await media.searchForMedia(body.query, body.mediaType);
            break;

        case 'getEpisodes':
            response = await media.getEpisodes(+body.mediaId, userId);
            break;

        case 'modifyEpisode':
            response = await media.modifyEpisode(userId, body.episode);
            break;

        case 'scanSubs':
            response = await media.getSubtitles(+body.mediaId);
            break;

        case 'scanEpisodes':
            await media.scanShow(+body.mediaId, body.thorough, !body.thorough);
            response = true;
            break;

        case 'scanAllMedia':
            await media.autoScan();
            response = true;
            break;

        case 'scanAllSubs':
            await media.scanAllSubs();
            response = true;
            break;

        case 'scanAllEpisodes':
            await media.scanAllEpisodes(false, true);
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
            await deluge.download(downRes?.url || '');
            response = !!downRes;
            break;

        case 'watchHistory':
            response = await user.getWatchHistory(userId, +body.page, +body.limit);
            break;

        case 'myList':
            response = await user.getMyList(userId, +body.page, +body.limit);
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

        case 'sharePlaylist':
            response = await playlist.sharePlaylist(userId, body.identifier, body.email);
            break;

        case 'getModdedMedia':
            response = await media.getMedia(+body.mediaId, userId);
            break;

        case 'deleteMedia':
            response = await modify.deleteMedia(userId, body.location);
            break;

        case 'getUserSettings':
            response = await user.getUserPlaybackSettings(userId);
            break;

        case 'deleteWatchEntry':
            response = await user.deleteWatchEntry(userId, +body.id);
            break;
    }

    res.status(200).json(response);
}
