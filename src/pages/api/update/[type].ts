import environment from "../../../../server/base/env";
import {MediaType} from '@prisma/client';
import {NextApiRequest, NextApiResponse} from "next";
import {confirmContext} from "../auth";
import {Update, UpdateInterface} from "../../../../server/classes/update";
import Springboard from "../../../../server/classes/springboard";
import {magnet} from "../../../../server/base/utils";
import User from "../../../../server/classes/auth";
const update = new Update();
const spring = new Springboard();
const user = new User();

export default async (req: NextApiRequest, res: NextApiResponse) => {
    let body = {...req.query};
    let {userId} = confirmContext(req.cookies);
    let response: any = "null";

    if (req.method === 'POST') {
        if (body.type === 'modify') {
            const obj: {data: UpdateInterface, location: string} = req.body;
            await spring.addMedia(obj.data, obj.location);
            response = true;
        }
    }

    if (await user.validateUser(userId)){
        if (body.type === 'search') {
            const search = Array.isArray(body.search) ? body.search[0] : body.search;
            response = await update.improveSearch(search);
        }

        if (body.type === 'recommend') {
            const tmdb_id = +(body.id);
            if (body.lib !== 'person') {
                const type = body.lib === 'movie'? MediaType.MOVIE: MediaType.SHOW;
                response = await spring.getOutsideRec(tmdb_id, type);

            } else response = await spring.getPersonInfo(tmdb_id, true);
        }

        if (body.type === 'download') {
            const type = body.lib === 'movie';
            const tmdb_id = +(body.id);
            response = type ? await magnet.findMovie(tmdb_id) : await magnet.findSeason(tmdb_id, 1);
        }

        if (body.type === 'libSearch') {
            const search = Array.isArray(body.value) ? body.value[0] : body.value;
            response = await update.performSearch(search);
        }

        if (body.type === 'libScan' || body.type === 'episodeScan' || body.type === 'subScan'){
            body.type === 'episodeScan' ? update.scanEpisodes(false) : body.type === 'subScan' ? update.getSubs() : update.autoScan();
            response = true;
        }

        if (body.type === 'episodeDown' || body.type === 'mediaDown') {
            body.type === 'episodeDown' ? spring.findNewEpisodes(): spring.findNewMedia();
            response = true;
        }

        if (body.type === 'missing')
            response = await update.getUnScanned();

        if (body.type === 'getMediaFile') {
            const media_id = +(body.id);
            response = await update.findFile(media_id);
        }

        if (body.type === 'mediaSearch') {
            const type = body.lib === 'movie'? MediaType.MOVIE: MediaType.SHOW;
            const search = Array.isArray(body.value) ? body.value[0] : body.value;
            response = search === '' ? []: await update.mediaSearch(search, type);
        }

        if (body.type === 'getMedia') {
            const type = body.lib === 'movie'? MediaType.MOVIE: MediaType.SHOW;
            const search = +(body.value);
            response = await update.getMedia(search, type);
        }

        if (body.type === 'findImages') {
            const type = body.lib === 'movie'? MediaType.MOVIE: MediaType.SHOW;
            const search = +(body.value);
            response = await update.interpretImages(type, search);
        }

        if (body.type === 'modifyMedia') {
            const search = +(body.id);
            response = await spring.getForEdit(search);
        }

        if (body.type === 'getManage') {
            const data = ['library', 'manage picks', 'get contents', 'system config'];
            response = environment.config.deluge || environment.config.usenet ? data:  ['library', 'manage picks', 'system config'];
        }
    }

    if (body.type === 'getSections') {
        const otherArray = ['about', 'account'];
        response = await user.validateUser(userId) ? [...otherArray, 'manage']: otherArray;
    }

    res.json(response)
}