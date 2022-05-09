import {NextApiRequest, NextApiResponse} from "next";
import PlayBack from "../classes/playBack";
import {Playlist, FramesCast} from "../classes/listEditors";
import {Modify} from "../classes/modify";
import {CookiePayload} from "../classes/middleware";

const playBack = new PlayBack();
const list = new Playlist();
const framesCast = new FramesCast();
const modify = new Modify();

export default async (req: NextApiRequest, res: NextApiResponse, data: CookiePayload & {userId: string}) => {
    const body = req.body;
    const query = req.query;
    let response: any;
    const type = req.query.type[1];
    const {session, userId} = data;

    switch (type) {
        case 'inform':
            response = true;
            await playBack.saveInformation(body.auth, userId, body.position);
            break;

        case 'pureSub':
            response = await playBack.getSub(query.auth as string, query.language as string, true);
            res.setHeader('Content-type', 'text/vtt');
            res.status(200).end(response);
            return;

        case 'subtitles':
            response = await playBack.getSub(query.auth as string, query.language as string, false);
            break;

        case 'upNext':
            response = await list.getUpNext(query.auth as string, query.language as string);
            break;

        case 'groupWatch':
            response = await framesCast.createModRoom(body.roomKey, body.auth, userId);
            break;

        case 'getDown':
            response = await framesCast.addFileToDownload(body.auth, body.authKey, userId);
            break;

        case 'genCypher':
            response = await framesCast.createFrame(body.cypher, body.auth, userId, body.position);
            break;

        case 'switchLang':
            response = await modify.modifyUserDefaultSub(userId, body.language);
            break;

        case 'worker':
            response = await playBack.getWorkerInfo(query.auth as string);
            break;

        case 'getInfo':
            const save = query.save === 'true';
            response = await playBack.getMediaLite(+query.id, userId, save);
            break;
    }

    res.status(200).json(response);
}
