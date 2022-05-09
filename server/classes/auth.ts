import bcrypt from 'bcrypt';
import fetch from 'cross-fetch';
import {PrismaClient, Role, UseCase} from '@prisma/client';
import requestIp from "request-ip";
import parser from "ua-parser-js";
import {NextApiRequest} from "next";
import {RestAPI} from "./stringExt";
import {Regrouped} from "../lib/environment";
import {regrouped} from "../lib/environment";
import {prisma} from "./utils";
import {Aggregate} from "./tmdb";

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

export interface AuthInterface {
    error?: string
    response?: string
    payLoad?: {session: string, context: Role, email: string, validUntil: number, notificationChannel: string }
}

export interface ManageAuthKey {
    case: UseCase;
    name: string;
    key: string;
    backdrop: string;
    description: string;
    access: number;
}

export class Base extends RestAPI {
    protected readonly fetch: (input: RequestInfo, init?: (RequestInit | undefined)) => Promise<Response>;
    protected readonly prisma: PrismaClient;
    protected tmdb: Aggregate | null;
    protected readonly regrouped: Regrouped = regrouped;
    protected readonly socket: any;

    constructor() {
        super();
        this.prisma = prisma;
        this.fetch = fetch;
        if (this.regrouped.tmdbToken)
            this.tmdb = new Aggregate(this.regrouped.tmdbToken);
        else
            this.tmdb = null;
    }
}

export class Session extends Base {

    /**
     * @desc confirms that session /Session exists if account is guest, the account is deleted
     * @param session - session to check
     */
    public async validateSession(session: string): Promise<AuthInterface> {
        let result = await this.prisma.session.findFirst({where: {session}, include: {user: true}});
        if (result) {
            if (result.user.role === Role.GUEST) {
                try {
                    await this.prisma.user.delete({where: {userId: result.userId}});
                } catch (e) {
                    console.log(e);
                }

                return {error: 'guest session has expired'}
            }

            return result.valid > new Date() ? {
                response: 'valid',
                payLoad: {
                    session,
                    validUntil: new Date(result.valid).getTime(),
                    context: result.user.role,
                    email: result.user.email,
                    notificationChannel: result.user.notificationChannel
                }
            } : {error: 'app id has expired'};
        }

        return {error: 'invalid app id provided'};
    }

    /**
     * @desc creates a new session for a user
     * @param userId - user id to be stored with generated auth key
     */
    public async generateSession(userId: string): Promise<{session: string, validUntil: number}> {
        const session = this.generateKey(5, 5);
        let valid = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
        await this.prisma.session.create({
            data: {
                session: session, valid: new Date(valid),
                userId, created: new Date()
            }
        })
        return {session, validUntil: valid};
    }

    /**
     * @desc clears out all sessions for a specific user
     * @param session - session to be cleared
     * @param userId - user id to be cleared
     */
    public async clearSession(session: string, userId = false): Promise<boolean> {
        if (userId) {
            await this.prisma.userIdentifier.deleteMany({where: {userId: session}});
            const user = await this.prisma.session.deleteMany({where: {userId: session}});
            return user.count > 0;

        } else {
            let result = await this.prisma.session.findFirst({where: {session}});
            if (result) {
                await this.prisma.userIdentifier.deleteMany({where: {userId: result.userId}});
                const user = await this.prisma.session.deleteMany({where: {userId: result.userId}});
                return user.count > 0;
            }
        }

        return false;
    }

    /**
     * @desc deletes a specific session for a user
     * @param session - session to be deleted
     */
    public async clearSingleSession(session: string) {
        const state = await this.prisma.session.findUnique({where: {session}, include: {user: true}});
        if (state) {
            try {
                if (state.user.role === Role.GUEST)
                    await this.prisma.user.delete({where: {userId: state.userId}});
                else
                    await this.prisma.session.delete({where: {session}});
            } catch (e) {
                console.log(e)
            }
        }
    }

    /**
     * @desc saves the identity of a specific user's session
     * @param sessionId - session id to be stored
     * @param req - request object
     */
    public async saveIdentity(sessionId: string, req: NextApiRequest) {
        const address = requestIp.getClientIp(req);
        const user = await this.getUserFromSession(sessionId);
        const ua = parser(req.headers['user-agent']);
        if (address && address !== '127.0.0.1' && user) {
            const osName = ua.os.name;
            const userId = user.userId;
            const browserName = ua.browser.name + ' ' + ua.browser.version;
            const identity = await this.prisma.userIdentifier.findFirst({where: {address}});
            let country: string, regionName: string, city: string;

            if (identity) {
                city = identity.city;
                country = identity.country;
                regionName = identity.regionName;

            } else {
                const client = await this.makeRequest<IP>('http://ip-api.com/json/' + address, null, 'GET');
                city = client?.city || '';
                country = client?.country || '';
                regionName = client?.regionName || '';
            }

            const data = {osName: osName || '', userId, browserName, sessionId, address, regionName, country, city};
            if (city && country && regionName)
                await this.prisma.userIdentifier.upsert({
                    create: data,
                    update: data,
                    where: {sessionId}
                });
        }
    }

    /**
     * @desc gets a user from a session
     * @param sessionId - session id to be stored
     */
    public async getUserFromSession(sessionId: string) {
        const session = await this.prisma.session.findUnique({where: {session: sessionId}, include: {user: true}});
        if (session)
            return session.user;
        return null;
    }
}

export class Auth extends Session {

    /**
     * @desc verifies the role of the provided user
     * @param userId - user id to be verified
     */
    public async validateUser(userId: string): Promise<boolean> {
        const user = await this.prisma.user.findFirst({where: {userId}});
        return user ? user.role === Role.ADMIN : false;
    }

    /**
     * @desc generates an auth key if the user has the right to generate one
     * @param userId - user id to be verified
     */
    public async generateAuthKey(userId: string): Promise<string | null> {
        if (await this.validateUser(userId)) {
            const authKey = this.generateKey(4, 5);
            await this.prisma.auth.create({
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
     * @param authKey - auth key to be checked
     * @param context - context of the request
     */
    public async validateAuthKey(authKey: string, context: Role): Promise<number> {
        let value = -1;
        if (authKey === 'homeBase' && (context === Role.ADMIN || context === Role.GUEST))
            value = 0;

        const authFile = await this.prisma.auth.findUnique({where: {authKey}});
        if (authFile)
            value = authFile.access;

        return value;
    }

    /**
     * @desc clears out the auth key by assigning a user to it and updating the accessing
     * @param authKey - auth key to be cleared
     * @param userId - user id to be assigned
     * @param useCase - use case of the request
     * @param authView - auth view of the request
     */
    public async utiliseAuthKey(authKey: string, userId: string, useCase: UseCase, authView: string | null = null) {
        const auth = await this.prisma.auth.findUnique({where: {authKey}});
        const user = await this.prisma.user.findUnique({where: {userId}});
        if (user && auth && auth.access === 0)
            await this.prisma.auth.update({
                where: {authKey},
                data: {userId, access: auth.access + 1, auth: authView, useCase}
            })

        else if (authKey !== 'homeBase')
            throw new Error('Unauthorised access attempted');
    }

    /**
     * @desc provides information about all keys on the database
     * @param userId - user requesting the information
     */
    public async getKeys(userId: string): Promise<ManageAuthKey[]> {
        if (await this.validateUser(userId)) {
            const keys = await this.prisma.auth.findMany({
                include: {
                    user: true,
                    view: {include: {episode: true, video: {include: {media: true}}}}
                }, orderBy: {id: 'desc'}
            });

            const response: ManageAuthKey[] = [];

            for (let item of keys) {
                let description = '';
                let backdrop = '';

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
     * @param email - email of the user
     * @param password - password of the user
     * @param authKey - auth key of the user
     * @param role - role of the user
     * @returns Promise<AuthInterface> auth object on with either error or response on success
     */
    public async register(email: string, password: string, authKey: string, role?: Role): Promise<AuthInterface> {
        role = role || Role.USER;
        const confirmedEmail = role === Role.OAUTH || role === Role.GUEST;
        password = await bcrypt.hash(password, 10);
        const notificationChannel = this.generateKey(13, 7);
        let userId = this.createUUID();

        let user = await this.prisma.user.findFirst({where:{email}});

        if (user)
            return {error: 'this email already exists'};

        const validAuth = await this.validateAuthKey(authKey, role);
        if (validAuth !== 0) {
            const error = validAuth === -1 ? 'invalid auth key' : 'this auth key has already been used';
            return {error};
        }

        const userRes = await this.prisma.user.create({
            data: {email, password, userId, role, confirmedEmail, notificationChannel}
        });

        await this.utiliseAuthKey(authKey, userId, UseCase.SIGNUP);
        return !confirmedEmail ? {error: 'Please check your email for a verification link'}: {
            response: 'User created successfully',
            payLoad: {
                email: userRes.email,
                context: userRes.role,
                notificationChannel: userRes.notificationChannel,
                ...await this.generateSession(userRes.userId)
            }
        };
    }

    /**
     * @desc attempts to log in a user with the given credentials
     * @param email - email of the user
     * @param password - password of the user
     * @returns Promise<AuthInterface> auth object with payload on success just error
     */
    public async authenticateUser(email: string, password: string): Promise<AuthInterface> {
        let user = await this.prisma.user.findFirst({where: {email}})
        if (user)
            if (await bcrypt.compare(password, user.password))
                if (user.confirmedEmail)
                    return {
                        response: 'logged in',
                        payLoad: {
                            email: user.email,
                            context: user.role,
                            notificationChannel: user.notificationChannel,
                            ...await this.generateSession(user.userId)
                        }
                    };

                else
                    return {error: 'email not confirmed'};

            else
                return {error: 'Incorrect password'};

        else
            return {error: 'No such user exists'};
    }

    /**
     * @desc checks if the email exists for the react form
     * @param email - email of the user
     * @returns boolean !!user exists
     */
    public async validateEmail(email: string): Promise<boolean> {
        let user = await this.prisma.user.findFirst({where: {email}});
        return !!user;
    }

    /**
     * @desc attempts to modify a user's details with the given credentials
     * @param email - email of the user
     * @param password - password of the user
     * @param userId - userId of the user
     */
    public async modifyUser(email: string, password: string, userId: string) {
        password = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.findUnique({where: {userId}});
        if (user) {
            if (user.role !== Role.OAUTH) {
                await this.clearSession(userId, true);
                await this.prisma.user.update({
                    data: {
                        email, password
                    }, where: {userId}
                })
            }
        }
    }

    /**
     * @desc creates a user from their OAUTH2 credentials
     * @param email - email of the user
     * @param password - password of the user
     * @param authKey - auth key of the user
     */
    public async oauthHandler(email: string, password: string, authKey: string): Promise<AuthInterface> {
        let response = await this.authenticateUser(email, `${password}`);
        if (response.error && response.error === 'No such user exists')
            response = await this.register(email, `${password}`, authKey, Role.OAUTH);

        return response;
    }

    /**
     * @desc creates the admin account and the guest accounts if they do not exist
     */
    public async createAccounts() {
        let password = this.generateKey(4, 5);
        password = await bcrypt.hash(password, 10);
        await this.prisma.user.upsert({
            create: {confirmedEmail: true, password, email: 'guest@frames.local', role: Role.GUEST, userId: this.createUUID()},
            update: {},
            where: {email: 'guest@frames.local'}
        });
        await this.prisma.user.upsert({
            where: {email: 'frames AI'},
            create: {confirmedEmail: true, password, email: 'frames AI', role: Role.ADMIN, userId: this.createUUID()},
            update: {}
        });
        if (this.regrouped.user)
            await this.prisma.user.upsert({
                create: {
                    confirmedEmail: true,
                    password: await bcrypt.hash(this.regrouped.user.admin_pass, 10),
                    email: this.regrouped.user.admin_mail,
                    role: Role.ADMIN,
                    userId: this.createUUID()
                },
                update: {},
                where: {email: this.regrouped.user.admin_mail}
            });
    }

    /**
     * @desc creates a guest user that in theory should be usable for one session
     * @param password - email of the user
     */
    public async createGuestUser(password: string) {
        const email = password + '@frames.local';
        return await this.register(email, password, 'homeBase', Role.GUEST);
    }

    /**
     * @desc changes the user's password and returns the new password in plain text
     * @param email - email of the user
     */
    public async forgotPassword(email: string): Promise<{password?: string, error?: string}> {
        const user = await this.prisma.user.findUnique({where: {email}});
        if (user) {
            const password = this.generateKey(4, 5);
            await this.prisma.user.update({
                data: {
                    password: await bcrypt.hash(password, 10)
                }, where: {userId: user.userId}
            });
            return {password};
        }

        return {error: 'No such user exists'};
    }
}
