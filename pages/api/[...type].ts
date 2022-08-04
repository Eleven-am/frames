import {NextApiRequest, NextApiResponse} from "next";
import load from "../../server/serverFunctions/load";
import auth from "../../server/serverFunctions/auth";
import media from "../../server/serverFunctions/media";
import modify from "../../server/serverFunctions/modify";
import settings from "../../server/serverFunctions/settings";
import Middleware from "../../server/classes/middleware";
import stream from "../../server/serverFunctions/stream";
import User from "../../server/classes/auth";

const middleware = new Middleware();
const user = new User();

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const data = await middleware.readCookie(req.cookies, 'frames-cookie');

    const type = req.query.type[0];
    const presentUser = await user.getUserFromSession(data.session);
    const userId = presentUser?.userId || 'unknown';
    const newData = {...data, userId};

    if (userId === 'unknown' && !['auth', 'stream'].includes(type)) {
        res.status(401).json({
            error: 'Unauthorized'
        });
        return;
    }

    switch (type) {
        case 'auth':
            await auth(req, res, newData);
            return;

        case 'load':
            await load(req, res, userId);
            return;

        case 'media':
            await media(req, res, userId);
            return;

        case 'stream':
            await stream(req, res, newData);
            return;

        case 'modify':
            await modify(req, res, userId);
            return;

        case 'settings':
            await settings(req, res, userId);
            return;
    }
}