import {NextApiRequest, NextApiResponse} from "next";
import User from "../classes/auth";
import Middleware from "../classes/middleware";
import Notification from "../classes/notification";
import {Modify} from "../classes/modify";
import {CookiePayload} from "../classes/middleware";

const user = new User();
const middleware = new Middleware();
const notification = new Notification();
const modify = new Modify();

if (process.env['FRAMESSEED'] === undefined)
    user.createAccounts()
        .then(() => {
            process.env['FRAMESSEED'] = String(true)
        })
        .catch((err) => {
            process.env['FRAMESSEED'] = String(false);
            console.log(err);
        })

export default async (req: NextApiRequest, res: NextApiResponse, data: CookiePayload & {userId: string}) => {
    let response: any;
    const {session, context, userId} = data;
    const query = req.query;

    if (req.method === 'GET') {
        if (query.action === 'logout' || query.action === 'clearSessions') {
            query.action === 'logout' ? await user.clearSingleSession(session): await user.clearSession(userId, true);
            await middleware.writeCookie(res, 'null', 'frames-cookie', -1);
            response = {action: 'logout', session: ''};
        }
    }

    const body = req.body;
    switch (body.process) {
        case 'confirmMail':
            response = await user.validateEmail(body.email);
            break;

        case 'confirmAuthKey':
            response = await user.validateAuthKey(body.auth, context);
            break;

        case 'manageKeys':
            response = await user.getKeys(userId);
            break;

        case 'context':
            const tempSession = body.session || session;
            const data = await user.validateSession(tempSession);
            if (data.payLoad) {
                await middleware.writeCookie(res, data.payLoad, 'frames-cookie', 86400);
                await user.saveIdentity(data.payLoad.session, req);

            } else if (data.error) {
                await middleware.writeCookie(res, 'null', 'frames-cookie', -1);
                await user.clearSingleSession(session);
            }

            response = data.error ? data : {
                context: {
                    email: data.payLoad?.email,
                    session: data.payLoad?.session,
                    channel: data.payLoad?.notificationChannel,
                    role: data.payLoad?.context
                }
            }
            break;

        case 'logIn':
            const loginData = await user.authenticateUser(body.user, body.pass);
            if (loginData.payLoad) {
                await middleware.writeCookie(res, loginData.payLoad, 'frames-cookie', 86400);
                await user.saveIdentity(loginData.payLoad.session, req);
            }

            response = loginData.error ? loginData : {
                context: {
                    email: loginData.payLoad?.email,
                    session: loginData.payLoad?.session,
                    channel: loginData.payLoad?.notificationChannel,
                    role: loginData.payLoad?.context
                }
            }
            break;

        case 'signAsGuest':
            const guestData = await user.createGuestUser('' + Date.now());
            if (guestData.payLoad) {
                await middleware.writeCookie(res, guestData.payLoad, 'frames-cookie', 86400);
                await user.saveIdentity(guestData.payLoad.session, req);
            }

            response = guestData.error ? guestData : {
                context: {
                    email: guestData.payLoad?.email,
                    session: guestData.payLoad?.session,
                    channel: guestData.payLoad?.notificationChannel,
                    role: guestData.payLoad?.context
                }
            }
            break;

        case 'OAUTH':
            const oauthData = await user.oauthHandler(body.user, body.pass, body.authKey);
            if (oauthData.payLoad) {
                await middleware.writeCookie(res, oauthData.payLoad, 'frames-cookie', 86400);
                await user.saveIdentity(oauthData.payLoad.session, req);
            }

            response = oauthData.error ? oauthData : {
                context: {
                    email: oauthData.payLoad?.email,
                    session: oauthData.payLoad?.session,
                    channel: oauthData.payLoad?.notificationChannel,
                    role: oauthData.payLoad?.context
                }
            }
            break;

        case 'generateAuthKey':
            const authKey = await user.generateAuthKey(userId);
            response = authKey ? {authKey} : authKey;
            break;

        case 'signUp':
            const signUpData = await user.register(body.user, body.pass, body.authKey);
            if (signUpData.payLoad) {
                await middleware.writeCookie(res, signUpData.payLoad, 'frames-cookie', 86400);
                await user.saveIdentity(signUpData.payLoad.session, req);
            }

            response = signUpData.error ? signUpData : {
                context: {
                    email: signUpData.payLoad?.email,
                    session: signUpData.payLoad?.session,
                    channel: signUpData.payLoad?.notificationChannel,
                    role: signUpData.payLoad?.context
                }
            }
            break;

        case 'getNotifications':
            response = await notification.getNotifications(userId);
            break;

        case 'modifyPlaybackInfo':
            response = await modify.modifyUserPlaybackSettings(userId, body.playbackInfo);
            break;

        case 'forgotPassword':
            const fpData = await user.forgotPassword(body.email);
            response = !!fpData?.password;
            break;
    }

    res.status(200).json(response);
}
