import {NextApiRequest, NextApiResponse} from "next";
import Media from "../classes/media";
import {ListEditors, Playlist} from "../classes/listEditors";
import {Modify} from "../classes/modify";

const mediaClass = new Media();
const list = new ListEditors();
const playlist = new Playlist();
const modify = new Modify();

export default async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
    let response: any = {};
    const type = req.query.type[1];
    const mediaId = +(Array.isArray(req.query.mediaId) ? req.query.mediaId[0] : req.query.mediaId);
    const mediaString = Array.isArray(req.query.mediaId) ? req.query.mediaId[0] : req.query.mediaId;

    switch (type) {
        case 'specificUserData':
            response = await playlist.getSpecificMediaInfo(mediaId, userId);
            break;

        case 'seen':
            response = await playlist.markAsSeen(mediaId, userId);
            break;

        case 'rate':
            response = await list.rateThis(mediaId, userId, +req.query.rate);
            break;

        case 'addToList':
            response = await list.addToList(mediaId, userId);
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
            await modify.getMissingEpisodesInShow(mediaId);
            response = true;
            break;

        case 'browse':
            response = await playlist.getBrowse(req.body, +req.query.page, userId);
            break;
    }

    res.status(200).json(response);
};