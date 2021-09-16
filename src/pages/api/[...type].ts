import {confirmContext} from "./auth";
import {NextApiRequest, NextApiResponse} from "next";
import load from "../../../next/routes/load";
import media from "../../../next/routes/media";
import updateRoute from "../../../next/routes/update";
import stream from "../../../next/routes/stream";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    let {userId} = confirmContext(req.cookies);

    if (req.query.type[0] === 'load') {
        await load(req, res, userId);
        return;
    }

    else if (req.query.type[0] === 'media') {
        await media(req, res, userId);
        return;
    }

    else if (req.query.type[0] === 'update') {
        await updateRoute(req, res, userId);
        return;
    }

    else if (req.query.type[0] === 'stream') {
        await stream(req, res, userId);
        return;
    }
}