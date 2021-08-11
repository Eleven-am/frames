import {Role} from '@prisma/client';
import {NextApiRequest, NextApiResponse} from "next";
import jwt, {sign} from "jsonwebtoken";
import cookie from "cookie";
import User from "../../../server/classes/auth";
import env from "../../../server/base/env";
import {Update} from "../../../server/classes/update";

const user = new User();
const update = new Update();

if (process.env['FRAMESSEED'] === undefined)
user.createAccounts()
    .then(() => {process.env['FRAMESSEED'] = String(true)})
    .then(() => update.autoScan())
    .then(() => update.scanEpisodes(false))
    .then(() => update.getSubs())
    .catch(err => console.warn(err));

const verify = <T extends object | null>(token: string, secret: string): T => {
    return jwt.verify(token, secret) as T;
};

export interface CookiePayload {
    userId: string;
    session: string;
    context: Role;
}

type CookieInterface = CookiePayload | null

export const writeCookie = async (res: NextApiResponse, userInstance: CookiePayload, req: NextApiRequest) => {
    const claim = sign({...userInstance}, env.config.secret, {expiresIn: 604800});
    await user.saveIdentity(userInstance.userId, userInstance.session, req);
    res.setHeader('Set-Cookie', cookie.serialize('frames-cookie', claim, {
        httpOnly: true,
        maxAge: 604800,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
    }))

    return userInstance;
}

const deleteCookie = async (res: NextApiResponse, session: string) => {
    await user.clearSingleSession(session);
    res.setHeader('Set-Cookie', cookie.serialize('frames-cookie', '', {
        httpOnly: true,
        maxAge: -1,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
    }))
}

export const confirmContext = (cookies: { [p: string]: string }) => {
    let session: string = 'unknown';
    let auth: boolean = false;
    let userId: string = 'unknown';

    try {
        let decoded = verify<CookieInterface>(cookies['frames-cookie'], env.config.secret);
        if (decoded) {
            userId = decoded.userId;
            session = decoded.session;
            auth = Role.ADMIN === decoded.context;
        }
    } catch (e) {}

    return {session, auth, userId}
}

export default async function (req: NextApiRequest, res: NextApiResponse) {
    let response: any;
    let {session, userId} = confirmContext(req.cookies);

    const query = req.query;
    if (req.method === 'GET') {
        if (query.action === 'logout') {
            await user.validateSession(session);
            await deleteCookie(res, session);
            res.json({action: 'logout', session: ''});

        } else if (query.action === 'framedUser') {
            const data = await user.getFramedUser(userId);
            if (data.payLoad)
                await writeCookie(res, data.payLoad, req);

            response = data.error ? data : {
                context: {
                    email: data.payLoad?.email,
                    session: data.payLoad?.session,
                    role: data.payLoad?.context
                }
            }
            res.status(200).json(response)

        }

        return;
    }

    const body = req.body
    if (body.process === 'confirmEmail')
        response = await user.validateEmail(body.email);

    else if (body.process === 'confirmAuthKey')
        response = await user.validateAuthKey(body.authKey);

    else if (body.process === 'confirmAuth') {
        const data = await user.validateSession(body.session);
        if (data.payLoad)
            await writeCookie(res, data.payLoad, req);

        else if (data.error)
            await deleteCookie(res, body.session);

        response = data.error ? data : {
            context: {
                email: data.payLoad?.email,
                session: data.payLoad?.session,
                role: data.payLoad?.context
            }
        }

    } else if (body.process === 'logIn') {
        const data = await user.authenticateUser(body.user, body.pass);
        if (data.payLoad)
            await writeCookie(res, data.payLoad, req);

        response = data.error ? data : {
            context: {
                email: data.payLoad?.email,
                session: data.payLoad?.session,
                role: data.payLoad?.context
            }
        }

    } else if (body.process === 'create') {
        const data = await user.register(body.user, body.pass, body.username, userId);
        if (data.payLoad)
            await writeCookie(res, data.payLoad, req);

        response = data.error ? data : {
            context: {
                email: data.payLoad?.email,
                session: data.payLoad?.session,
                role: data.payLoad?.context
            }
        }

    } else if (body.process === 'OAUTH') {
        const data = await user.oauthHandler(body.user, body.pass, body.username, body.authKey);
        if (data.payLoad)
            await writeCookie(res, data.payLoad, req);

        response = data.error ? data : {
            context: {
                email: data.payLoad?.email,
                session: data.payLoad?.session,
                role: data.payLoad?.context
            }
        }

    } else if (body.process === 'guestIn') {
        const data = await user.createGuestUser(body.guest);
        if (data.payLoad)
            await writeCookie(res, data.payLoad, req);

        response = data.error ? data : {
            context: {
                email: data.payLoad?.email,
                session: data.payLoad?.session,
                role: data.payLoad?.context
            }
        }

    } else if (body.process === 'generateAuthKey') {
        response = await user.generateAuthKey(userId);

    }

    res.status(200).json(response)
}