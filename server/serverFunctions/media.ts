import {NextApiRequest, NextApiResponse} from "next";
import Media from "../classes/media";
import Playlist from "../classes/playlist";
import User from "../classes/user";

const mediaClass = new Media();
const playlist = new Playlist();
const user = new User();

export default async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
    let response: any = {};
    const type = req.query.type[1];
    const mediaId = +(Array.isArray(req.query.mediaId) ? req.query.mediaId[0] : req.query.mediaId);
    const mediaString = Array.isArray(req.query.mediaId) ? req.query.mediaId[0] : req.query.mediaId;

    switch (type) {
        case 'specificUserData':
            response = await user.getSpecificMediaInfo(mediaId, userId);
            break;

        case 'seen':
            response = await user.setSeen(userId, mediaId);
            break;

        case 'rate':
            response = await user.rateThis(mediaId, userId, +req.query.rate);
            break;

        case 'addToList':
            response = await user.addToList(mediaId, userId);
            break;

        case 'episodes':
            response = await mediaClass.getSeason(mediaId, +req.query.season, userId);
            break;

        case 'collectionPlaylist':
            response = await playlist.generatePlaylist('COLLECTION', mediaId, userId);
            break;

        case 'prodPlaylist':
            response = await playlist.generatePlaylist('COMPANY', mediaString, userId);
            break;

        case 'personPlaylist':
            response = await playlist.generatePlaylist('PERSON', mediaId, userId);
            break;

        case 'downloadShow':
            await mediaClass.getMissingEpisodesInShow(mediaId);
            response = true;
            break;

        case 'browse':
            response = await user.getBrowse(req.body, +req.query.page, userId);
            break;
    }

    res.status(200).json(response);
};