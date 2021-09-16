import {NextApiRequest, NextApiResponse} from "next";
import FramesCast from "../../server/classes/framesCast";
import Playback from "../../server/classes/playback";
import Springboard from "../../server/classes/springboard";

const play = new Playback();
const spring = new Springboard();
const frames = new FramesCast();

export default async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
    let response: any = {};

    let body = {...req.query};
    body.type = body.type[1];

    if (req.method === 'POST') {
        let post = req.body;

        if (body.type === 'inform') {
            response = false;
            if (userId !== 'unknown')
                response = await play.updateStreamInformation(userId, post.auth, post.position);
        }

        if (body.type === 'genCypher')
            response = await frames.createFrame(post.cypher, post.auth, userId, Math.ceil(post.position));

        if (body.type === 'getDown')
            response = {location: await play.addFileForDownload(post.auth, post.authKey, userId)};

        if (body.type === "groupWatch")
            response = await frames.createModRoom(post.roomKey, post.auth, userId);
    }

    if (body.type === 'play') {
        let mediaId = +(body.media);
        response = false;
        if (userId !== 'unknown')
            response = await spring.playMedia(mediaId, userId);
    }

    if (body.type === 'find') {
        let auth = Array.isArray(body.auth) ? body.auth[0] : body.auth;
        response = false;
        if (userId !== 'unknown') {
            response = await spring.findByAuth(auth, userId);
            delete response.poster;
        }
    }

    if (body.type === 'next') {
        let videoId = +(body.media);
        response = false;
        if (userId !== 'unknown')
            response = await spring.upNext(videoId, userId);
    }

    if (body.type === 'playlist') {
        let videoId = +(body.media);
        response = await spring.upNextPlaylist(videoId, userId);
    }

    if (body.type === 'nextImage') {
        let file = Array.isArray(body.media) ? body.media[0] : body.media;
        const bool = file.charAt(0) === 'e' || file.charAt(0) === 'x';
        file = file.replace(/^[ex]/, '');
        response = await play.getNextHolder(+(file), bool);
    }

    if (body.type === 'file') {
        let file = Array.isArray(body.auth) ? body.auth[0] : body.auth;
        if (req.headers.range)
            await play.playFile(file, req, res)

        else
            res.status(400).json('no range provided');

        return;
    }

    if (body.type === 'subtitles') {
        let auth = Array.isArray(body.auth) ? body.auth[0] : body.auth;
        let language = Array.isArray(body.language) ? body.language[0] : body.language;
        response = await play.getSub(auth, language)
    }

    if (body.type === 'worker') {
        let auth = Array.isArray(body.auth) ? body.auth[0] : body.auth;
        response = await spring.getName(auth);
    }

    res.json(response);
}