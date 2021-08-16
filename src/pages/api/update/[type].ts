import environment from "../../../../server/base/env";
import {MediaType} from '@prisma/client';
import {NextApiRequest, NextApiResponse} from "next";
import {confirmContext} from "../auth";
import {Update, UpdateInterface} from "../../../../server/classes/update";
import Springboard from "../../../../server/classes/springboard";
import {drive, magnet} from "../../../../server/base/utils";
import User from "../../../../server/classes/auth";
import {ListEditors} from "../../../../server/classes/listEditors";
import {PickUpdate} from "../../../../next/utils/editPicks";

const list = new ListEditors()
const update = new Update();
const spring = new Springboard();
const user = new User();

export default async (req: NextApiRequest, res: NextApiResponse) => {
    let body = {...req.query};
    let {userId} = confirmContext(req.cookies);
    let response: any = "null";

    if (body.type === 'getSections') {
        const otherArray = ['about', 'account'];
        response = await user.validateUser(userId) ? [...otherArray, 'manage']: otherArray;
    }

    else if (await user.validateUser(userId)){
        if (req.method === 'POST') {
            if (body.type === 'modify') {
                const obj: {data: UpdateInterface, location: string} = req.body;
                await spring.addMedia(obj.data, obj.location);
                response = true;
            }

            else if (body.type === 'delete')
                response = await drive.deleteFile(req.body.file);

            else if (body.type === 'editorPicks') {
                const obj: PickUpdate = req.body;
                await list.addPick(obj.mediaIds, obj.category, obj.display, obj.type, obj.active);
                response = true;
            }
        }

        else if (body.type === 'search') {
            const search = Array.isArray(body.search) ? body.search[0] : body.search;
            response = await update.improveSearch(search);
        }

        else if (body.type === 'recommend') {
            const tmdb_id = +(body.id);
            if (body.lib !== 'person') {
                const type = body.lib === 'movie'? MediaType.MOVIE: MediaType.SHOW;
                response = await spring.getOutsideRec(tmdb_id, type);

            } else response = await spring.getPersonInfo(tmdb_id, true);
        }

        else if (body.type === 'download') {
            const type = body.lib === 'movie';
            const tmdb_id = +(body.id);
            response = type ? await magnet.findMovie(tmdb_id) : await magnet.findSeason(tmdb_id, 1);
        }

        else if (body.type === 'libSearch') {
            const search = Array.isArray(body.value) ? body.value[0] : body.value;
            response = await update.performSearch(search);
        }

        else if (body.type === 'libScan' || body.type === 'episodeScan' || body.type === 'subScan'){
            body.type === 'episodeScan' ? update.scanEpisodes(false) : body.type === 'subScan' ? update.getSubs() : update.autoScan();
            response = true;
        }

        else if (body.type === 'episodeDown' || body.type === 'mediaDown') {
            body.type === 'episodeDown' ? spring.findNewEpisodes(): spring.findNewMedia();
            response = true;
        }

        else if (body.type === 'missing')
            response = await update.getUnScanned();

        else if (body.type === 'getMediaFile') {
            const media_id = +(body.id);
            response = await update.findFile(media_id);
        }

        else if (body.type === 'mediaSearch') {
            const type = body.lib === 'movie'? MediaType.MOVIE: MediaType.SHOW;
            const search = Array.isArray(body.value) ? body.value[0] : body.value;
            response = search === '' ? []: await update.mediaSearch(search, type);
        }

        else if (body.type === 'getMedia') {
            const type = body.lib === 'movie'? MediaType.MOVIE: MediaType.SHOW;
            const search = +(body.value);
            response = await update.getMedia(search, type);
        }

        else if (body.type === 'findImages') {
            const type = body.lib === 'movie'? MediaType.MOVIE: MediaType.SHOW;
            const search = +(body.value);
            response = await update.interpretImages(type, search);
        }

        else if (body.type === 'modifyMedia') {
            const search = +(body.id);
            response = await spring.getForEdit(search);
        }

        else if (body.type === 'getManage') {
            const data = ['library', 'manage picks', 'get contents', 'system config'];
            response = environment.config.deluge || environment.config.usenet ? data:  ['library', 'manage picks', 'system config'];
        }

        else if (body.type === 'getPicks')
            response = await list.getPicks();

        else if (body.type === 'getPick') {
            const search = Array.isArray(body.value) ? body.value[0] : body.value;
            response = await list.getSpecificPick(search);
        }

        else if (body.type === 'externalScan') {
            const file = Array.isArray(body.file) ? body.file[0] : body.file;
            response = !!(await drive.readFolder(file)).length;
            if (body.lib === 'mov')
                update.autoScan(file, '');
            else
                update.autoScan('', file);
        }
    }

    res.json(response)
}