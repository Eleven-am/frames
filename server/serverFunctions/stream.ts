import {NextApiRequest, NextApiResponse} from "next";
import {CookiePayload} from "../classes/middleware";
import Playback from "../classes/playback";
import User from "../classes/user";
import PickAndFrame from "../classes/pickAndFrame";
import Springboard from "../classes/springboard";

const playBack = new Playback();
const user = new User();
const framesCast = new PickAndFrame();
const springboard = new Springboard();

export default async (req: NextApiRequest, res: NextApiResponse, data: CookiePayload & { userId: string }) => {
    const body = req.body;
    const query = req.query;
    let response: any;
    const type = req.query.type[1];
    const {userId, session} = data;

    switch (type) {
        case 'inform':
            response = true;
            await user.saveInformation(body.auth, userId, body.position);
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
            response = await springboard.getUpNext(query.auth as string, query.language as string);
            break;

        case 'groupWatch':
            response = await framesCast.createModRoom(body.roomKey, body.auth, userId);
            break;

        case 'getDown':
            const location = await framesCast.addFileToDownload(body.auth, body.authKey, userId);
            response = {location};
            break;

        case 'genCypher':
            response = await framesCast.createFrame(body.cypher, body.auth, userId, body.position);
            break;

        case 'switchLang':
            response = await user.modifyUserDefaultSub(userId, body.language);
            break;

        case 'worker':
            response = await playBack.getWorkerInfo(query.auth as string);
            break;

        case 'getInfo':
            const save = query.save === 'true';
            response = await playBack.getMediaLite(+query.id, userId, save);
            break;

        case 'meta':
            response = await springboard.getMetaTags(body.type, body.value);
            break;

        case 'loadVideo':
            response = await springboard.startPlayback(body.media, session, true, body.playbackKey);
            break;
    }

    res.status(200).json(response);
}
