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
    let response: any;
    const type = req.query.type[1];
    const body = {...req.body, ...req.query, type: req.query.type[2] || req.body.type};
    const {userId, session} = data;

    switch (type) {
        case 'inform':
            response = true;
            await user.saveInformation(body.auth, userId, body.position);
            break;

        case 'pureSub':
            response = await playBack.getSub(body.auth as string, body.language as string, true);
            res.setHeader('Content-type', 'text/vtt');
            res.status(200).end(response);
            return;

        case 'subtitles':
            response = await playBack.getSub(body.auth as string, body.language as string, false);
            break;

        case 'upNext':
            response = await springboard.getUpNext(body.auth as string, body.language as string);
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
            response = await playBack.getWorkerInfo(body.auth as string);
            break;

        case 'getInfo':
            const save = body.save === 'true';
            response = await playBack.getMediaLite(+body.id, userId, save);
            break;

        case 'meta':
            response = await springboard.getMetaTags(body.type, body.value);
            break;

        case 'loadVideo':
            response = await springboard.startPlayback(body.media, session, true, body.playbackKey);
            break;

        case 'getTrendingImages':
            const trending = await springboard.getTrending();
            response = trending.map(item => item.poster);
            break;
    }

    res.status(200).json(response);
}
