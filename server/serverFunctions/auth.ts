import {NextApiRequest, NextApiResponse} from "next";
import AuthService from "../classes/auth";
import {CookiePayload} from "../classes/middleware";
import User from "../classes/user";
import {Role} from "@prisma/client";

const authService = new AuthService();
const user = new User();

if (process.env['FRAMESSEED'] === undefined)
    authService.createAccounts()
        .then(() => {
            process.env['FRAMESSEED'] = String(true)
        })
        .catch((err) => {
            process.env['FRAMESSEED'] = String(false);
            console.log(err);
        })

export default async (req: NextApiRequest, res: NextApiResponse, data: CookiePayload & { userId: string }) => {
    let response: any;
    const {session, context, userId} = data;
    const query = req.query;

    if (req.method === 'GET') {
        if (query.action === 'logout' || query.action === 'clearSessions') {
            query.action === 'logout' ? await authService.clearSingleSession(session) : await authService.clearAllSessions(userId);
            await authService.writeCookie(res, 'null', 'frames-cookie', -1);
            response = {action: 'logout', session: ''};
        }
    }

    const body = req.body;
    switch (body.process) {
        case 'confirmMail':
            response = await authService.validateEmail(body.email);
            break;

        case 'confirmAuthKey':
            response = await authService.validateAuthKey(body.auth, context);
            break;

        case 'manageKeys':
            response = await authService.getKeys(userId);
            break;

        case 'context':
            const tempSession = body.session || session;
            const data = await authService.validateSession(tempSession);

            if (data.error) {
                await authService.writeCookie(res, 'null', 'frames-cookie', -1);
                await authService.clearSingleSession(tempSession);
            }

            response = await authService.handleAuth(req, res, data);
            break;

        case 'logIn':
            const loginData = await authService.authenticateUser(body.user, body.pass, body.baseUrl);
            response = await authService.handleAuth(req, res, loginData);
            break;

        case 'signAsGuest':
            const guestData = await authService.createGuestUser('' + Date.now());
            response = await authService.handleAuth(req, res, guestData);
            break;

        case 'OAUTH':
            const oauthData = await authService.oauthHandler(body.user, body.pass, body.authKey);
            response = await authService.handleAuth(req, res, oauthData);
            break;

        case 'generateAuthKey':
            const authKey = await authService.generateAuthKey(userId);
            response = authKey ? {authKey} : authKey;
            break;

        case 'signUp':
            response = await authService.register(body.user, body.pass, body.authKey, Role.USER, body.baseUrl);
            break;

        case 'getNotifications':
            response = await user.getNotifications(userId);
            break;

        case 'modifyPlaybackInfo':
            response = await user.modifyUserPlaybackSettings(userId, body.playbackInfo);
            break;

        case 'forgotPassword':
            const fpData = await authService.sendResetPasswordEmail(body.email, body.baseUrl);
            response = fpData.error ? fpData : true;
            break;

        case 'getResetPassword':
            const resetData = await authService.resetPassword(body.token);
            response = await authService.handleAuth(req, res, resetData);
            break;

        case 'modifyPassword':
            const mpData = await authService.modifyPassword(body.email, body.password, body.baseUrl);
            response = await authService.handleAuth(req, res, mpData);
            break;

        case 'verifyEmail':
            const veData = await authService.verifyEmail(body.token);
            response = await authService.handleAuth(req, res, veData);
            break;
    }

    res.status(200).json(response);
}
