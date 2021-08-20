import bcrypt from 'bcrypt';
import {Role, UseCase} from '@prisma/client';
import {create_UUID, generateKey, get} from "../base/baseFunctions";
import {prisma} from '../base/utils';
import env from "../base/env";
import requestIp from "request-ip";
import parser from "ua-parser-js";
import {NextApiRequest} from "next";

interface IP {
    status: string;
    country: string;
    countryCode: string;
    region: string;
    regionName: string;
    city: string;
    zip: string;
    lat: number;
    lon: number;
    timezone: string;
    isp: string;
    org: string;
    as: string;
    query: string;
}

const environment = env.config;

export interface AuthInterface {
    error?: string
    response?: string
    payLoad?: { userId: string, session: string, context: Role, email: string }
}

export interface ManageAuthKey {
    case: UseCase;
    name: string;
    key: string;
    backdrop: string;
    description: string;
    access: number;
}

export class Session {

    /**
     * @desc confirms that session /Session exists if account is guest, the account is deleted
     * @param session
     */
    async validateSession(session: string): Promise<AuthInterface> {
        let result = await prisma.session.findFirst({where: {session}, include: {user: true}});
        if (result) {
            if (result.user.role === Role.GUEST) {
                try {
                    await prisma.user.delete({where: {userId: result.userId}});
                } catch (e) {
                    console.log(e);
                }

                return {error: 'guest session has expired'}
            }

            return result.valid > new Date() ? {
                response: 'valid',
                payLoad: {userId: result.userId, session, context: result.user.role, email: result.user.email}
            } : {error: 'app id has expired'};
        }

        return {error: 'invalid app id provided'};
    }

    /**
     * @param userId user id to be stored with generated auth key
     * @returns an session
     */
    async generateSession(userId: string): Promise<string> {
        const session = generateKey(5, 5);
        let valid = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
        await prisma.session.create({
            data: {
                session: session, valid: new Date(valid),
                userId, created: new Date()
            }
        })
        return session;
    }

    /**
     * @desc clears out all sessions for a specific user
     * @param session
     * @param userId
     */
    async clearSession(session: string, userId = false): Promise<boolean> {
        if (userId) {
            await prisma.userIdentifier.deleteMany({where: {userId: session}});
            const user = await prisma.session.deleteMany({where: {userId: session}});
            return user.count > 0;

        } else {
            let result = await prisma.session.findFirst({where: {session}});
            if (result) {
                await prisma.userIdentifier.deleteMany({where: {userId: result.userId}});
                const user = await prisma.session.deleteMany({where: {userId: result.userId}});
                return user.count > 0;
            }
        }

        return false;
    }

    /**
     * @desc deletes a specific session for a user
     * @param session
     */
    async clearSingleSession(session: string) {
        const state = await prisma.session.findUnique({where: {session}});
        if (state) {
            try {
                await prisma.session.delete({where: {session}});
            } catch (e) {
                console.log(e)
            }
        }
    }

    /**
     * @desc saves the identity of a specific user's session
     * @param userId
     * @param sessionId
     * @param req
     */
    async saveIdentity(userId: string, sessionId: string, req: NextApiRequest) {
        const address = requestIp.getClientIp(req);
        const ua = parser(req.headers['user-agent']);
        if (address && address !== '127.0.0.1') {
            const osName = ua.os.name;
            const browserName = ua.browser.name + ' ' + ua.browser.version;
            const identity = await prisma.userIdentifier.findFirst({where: {address}});
            let country: string, regionName: string, city: string;

            if (identity) {
                city = identity.city;
                country = identity.country;
                regionName = identity.regionName;

            } else {
                const client: IP | false = await get('http://ip-api.com/json/' + address);
                city = client === false ? '' : client.city;
                country = client === false ? '' : client.country;
                regionName = client === false ? '' : client.regionName;
            }

            const data = {osName: osName || '', userId, browserName, sessionId, address, regionName, country, city};
            if (city && country && regionName)
                await prisma.userIdentifier.upsert({
                    create: data,
                    update: data,
                    where: {sessionId}
                });
        }
    }
}

export class Auth extends Session {

    /**
     * @desc verifies the role of the provided user
     * @param userId
     */
    async validateUser(userId: string): Promise<boolean> {
        const user = await prisma.user.findFirst({where: {userId}});
        return user ? user.role === Role.ADMIN : false;
    }

    /**
     * @desc generates an auth key if the user has the right to generate one
     * @param userId
     */
    async generateAuthKey(userId: string): Promise<string | null> {
        if (await this.validateUser(userId)) {
            const authKey = generateKey(4, 5);
            await prisma.auth.create({
                data: {
                    authKey,
                    userId, access: 0,
                    created: new Date()
                }
            })

            return authKey;
        }
        return null;
    }

    /**
     * @desc checks if the auth key is valid or even exists
     * @param authKey
     */
    async validateAuthKey(authKey: string): Promise<number> {
        let value = -1;
        const authFile = await prisma.auth.findUnique({where: {authKey}});
        if (authKey === 'homeBase')
            value = 0;

        if (authFile)
            value = authFile.access;

        return value;
    }

    /**
     * @desc clears out the auth key by assigning a user to it and updating the accessing
     * @param authKey
     * @param userId
     * @param useCase
     * @param authView
     */
    async utiliseAuthKey(authKey: string, userId: string, useCase: UseCase, authView: string | null = null) {
        const auth = await prisma.auth.findUnique({where: {authKey}});
        const user = await prisma.user.findUnique({where: {userId}});
        if (user && auth && auth.access === 0)
            await prisma.auth.update({
                where: {authKey},
                data: {userId, access: auth.access + 1, auth: authView, useCase}
            })

        else if (authKey !== 'homeBase')
            throw new Error('Unauthorised access attempted');
    }

    /**
     * @desc provides information about all keys on the database
     * @param userId user requesting the information
     */
    async getKeys(userId: string): Promise<ManageAuthKey[]> {
        if (await this.validateUser(userId)) {
            const keys = await prisma.auth.findMany({
                include: {
                    user: true,
                    view: {include: {episode: true, video: {include: {media: true}}}}
                }, orderBy: {id: 'desc'}
            });

            const response: ManageAuthKey[] = [];

            for (let item of keys) {
                let description = '';
                let backdrop = '/frames.png';

                if (item.access === 0)
                    description = item.user.email + ' created this auth key';

                else {
                    description = item.useCase === UseCase.SIGNUP ? item.user.email + ' signed up with this auth key' : '';

                    if (item.view) {
                        let media = item.view.video.media.name;
                        backdrop = item.view.video.media.backdrop;

                        if (item.view.episode)
                            media = media + `: S${item.view.episode.seasonId}, E${item.view.episode.episode}`;

                        description = item.user.email + ' downloaded ' + media + ' using this auth key';
                    }
                }

                response.push({
                    case: item.useCase,
                    description, backdrop, key: item.authKey,
                    name: 'Key: ' + item.authKey, access: item.access
                })
            }

            return response;
        }

        return []
    }
}

export default class User extends Auth {

    /**
     * @desc creates a new user with the given details
     * @param email
     * @param password
     * @param username
     * @param authKey
     * @param role
     * @returns Promise<AuthInterface> auth object on with either error or response on success
     */
    async register(email: string, password: string, username: string, authKey: string, role: Role = Role.USER): Promise<AuthInterface> {
        password = await bcrypt.hash(password, 10);
        let userId = create_UUID();

        let user = await prisma.user.findFirst({where: {OR: [{email}, {username}]}});

        if (user)
            return {error: 'this ' + (user.email === email ? 'email' : 'username') + ' already exists'};

        const validAuth = await this.validateAuthKey(authKey);
        if (validAuth !== 0) {
            const error = validAuth === -1 ? 'invalid auth key' : 'this auth key has already been used';
            return {error};
        }

        await prisma.user.create({
            data: {email, username, password, userId, role}
        });
        await this.utiliseAuthKey(authKey, userId, UseCase.SIGNUP);
        return {
            response: 'created',
            payLoad: {email, session: await this.generateSession(userId), userId, context: role}
        };
    }

    /**
     * @desc attempts to log in a user with the given credentials
     * @param email
     * @param password
     * @returns Promise<AuthInterface> auth object with payload on success just error
     */
    async authenticateUser(email: string, password: string): Promise<AuthInterface> {
        let user = await prisma.user.findFirst({where: {email}})
        if (user) {
            if (await bcrypt.compare(password, user.password))
                return {
                    response: 'logged in',
                    payLoad: {
                        email: user.email,
                        context: user.role,
                        userId: user.userId,
                        session: await this.generateSession(user.userId)
                    }
                };

            return {error: 'Incorrect password'};
        }

        return {error: 'No such user exists'};
    }

    /**
     * @description checks if the email exists for the react form
     * @param email
     * @returns boolean !!user exists
     */
    async validateEmail(email: string): Promise<boolean> {
        let user = await prisma.user.findFirst({where: {email}});
        return !!user;
    }

    /**
     * @desc attempts to modify a user's details with the given credentials
     * @param email
     * @param password
     * @param username
     * @param userId
     */
    async modifyUser(email: string, password: string, username: string, userId: string) {
        password = await bcrypt.hash(password, 10);
        const user = await prisma.user.findUnique({where: {userId}});
        if (user) {
            if (user.role !== Role.OAUTH) {
                await this.clearSession(userId, true);
                await prisma.user.update({
                    data: {
                        email, password, username
                    }, where: {userId}
                })

            } else await prisma.user.update({
                data: {username}, where: {userId}
            })
        }
    }

    /**
     * @desc creates a user from their OAUTH2 credentials
     * @param email
     * @param password
     * @param username
     * @param authKey
     */
    async oauthHandler(email: string, password: string, username: string, authKey: string): Promise<AuthInterface> {
        let response = await this.authenticateUser(email, `${password}`);
        if (response.error && response.error === 'No such user exists')
            response = await this.register(email, `${password}`, username, authKey, Role.OAUTH);

        return response;
    }

    /**
     * @desc creates the admin account and the guest accounts if they do not exist
     */
    async createAccounts() {
        let password = generateKey(4, 5);
        password = await bcrypt.hash(password, 10);
        await prisma.user.upsert({
            create: {password, email: 'guest@frames.local', role: Role.GUEST, userId: create_UUID()},
            update: {},
            where: {email: 'guest@frames.local'}
        });
        if (environment.admin_mail !== '' && environment.admin_pass !== '')
            await prisma.user.upsert({
                create: {
                    password: await bcrypt.hash(environment.admin_pass, 10),
                    email: environment.admin_mail,
                    role: Role.ADMIN,
                    userId: create_UUID()
                },
                update: {},
                where: {email: environment.admin_mail}
            });
    }

    /**
     * @desc gets the guest user, useful for SEO displays and other critical things
     */
    async getGuest(): Promise<string> {
        const user = await prisma.user.findUnique({where: {email: 'guest@frames.local'}});
        if (user)
            return user.userId;

        return 'unknown';
    }

    /**
     * @desc creates a guest user that in theory should be usable for one session
     */
    async createGuestUser(password: string) {
        const username = password;
        const email = password + '@frames.local';
        return await this.register(email, password, username, 'homeBase', Role.GUEST);
    }

    /**
     * @desc checks if a user with this userId exists
     * @param userId
     */
    async confirmUserId(userId: string) {
        const user = await prisma.user.findUnique({where: {userId}});
        return !!user;
    }

    /**
     * @desc gets a user's details using frames' framework
     * @param userId
     */
    async getFramedUser(userId: string): Promise<AuthInterface> {
        const user = await prisma.user.findUnique({where: {userId}});
        if (user) {
            return {
                payLoad: {
                    email: user.email,
                    context: user.role,
                    userId: user.userId,
                    session: await this.generateSession(user.userId)
                }, response: user.role === Role.GUEST ? 'guest user' : 'authenticated user'
            }
        }

        return await this.createGuestUser('' + Date.now())
    }
}
