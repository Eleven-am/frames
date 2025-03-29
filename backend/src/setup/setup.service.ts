import { TaskEither, createBadRequestError, Either } from '@eleven-am/fp';
import { Provider } from '@eleven-am/nestjs-storage';
import { TmDBApi } from '@eleven-am/tmdbapi';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Role, MediaType, CloudDrive, CloudStorage, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { CacheService } from '../cache/cache.service';
import { OpenSubtitlesResultConstructor } from '../config/openSubtitlesConfig';
import { HttpService } from '../http/http.service';
import { FanArtBulkImagesSchema } from '../images/images.contracts';
import { LanguageService } from '../language/language.service';
import { PubSubService } from '../misc/pubsub.service';
import { RetrieveService } from '../misc/retrieve.service';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_ADDED_EVENT } from '../scanner/scanner.constants';
import { SlimStorageSchema } from '../storage/storage.schema';
import { StorageService } from '../storage/storage.service';

import { SETUP_OAUTH_CACHE_KEY } from './setup.constants';
import {
    TmdbApiKeyParams,
    FanArtTvApiKeyParams,
    OpenAiApiKeyParams,
    MailServerParams,
    OpenSubtitlesParams,
    AdminAccountParams,
    OauthClientParams,
    OauthProvider,
    ReadFolderArgs,
    S3Params,
    UpdateSetupStorageArgs,
    SetupConfigurationSchema,
} from './setup.contracts';


// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
const OS = require('opensubtitles-api') as OpenSubtitlesResultConstructor;

@Injectable()
export class SetupService {
    constructor (
        private readonly retrieveService: RetrieveService,
        private readonly languageService: LanguageService,
        private readonly storageService: StorageService,
        private readonly prismaService: PrismaService,
        private readonly eventEmitter: EventEmitter2,
        private readonly cacheStore: CacheService,
        private readonly httpService: HttpService,
        private readonly pubSubService: PubSubService,
    ) {}

    public saveTmdbApiKey (params: TmdbApiKeyParams) {
        const tmdbApi = new TmDBApi(params.tmdbApiKey, fetch);

        const validate = TaskEither
            .tryCatch(
                () => tmdbApi.validateKey(),
                'Invalid Tmdb API key',
            )
            .filter(
                (result) => result.success,
                () => createBadRequestError('Invalid Tmdb API key'),
            );

        return this.retrieveService.getTmdbApiKey()
            .flip(
                () => validate,
                () => createBadRequestError('Tmdb API key already set'),
            )
            .chain((valid) => valid)
            .chain(() => this.retrieveService.setTmdbApiKey(params.tmdbApiKey))
            .map(() => ({ message: 'Tmdb API key saved' }));
    }

    public saveFanArtApiKey (params: FanArtTvApiKeyParams) {
        const fanArtParams = {
            api_key: params.fanArtTvApiKey,
        };

        const validate = this.httpService
            .getSafe(
                'https://webservice.fanart.tv/v3/movies/550',
                FanArtBulkImagesSchema,
                { params: fanArtParams },
            )
            .mapError(() => createBadRequestError('Invalid FanArtTv API key'));

        return this.retrieveService.getFanArtApiKey()
            .flip(
                () => validate,
                () => createBadRequestError('FanArtTv API key already set'),
            )
            .chain((valid) => valid)
            .chain(() => this.retrieveService.setFanArtApiKey(params.fanArtTvApiKey))
            .map(() => ({ message: 'FanArtTv API key saved' }));
    }

    public saveOpenAiApiKey (params: OpenAiApiKeyParams) {
        const headers = {
            Authorization: `Bearer ${params.openAiApiKey}`,
            'Content-Type': 'application/json',
        };

        const validate = this.httpService
            .getSafe(
                'https://api.openai.com/v1/models/gpt-3.5-turbo-instruct',
                z.object({
                    id: z.string(),
                    object: z.string(),
                    created: z.number(),
                }),
                { headers },
            )
            .mapError(() => createBadRequestError('Invalid OpenAi API key'));

        return this.retrieveService.getOpenAiApiKey()
            .flip(
                () => validate,
                () => createBadRequestError('OpenAi API key already set'),
            )
            .chain((valid) => valid)
            .chain(() => this.retrieveService.setOpenAiApiKey(params.openAiApiKey))
            .map(() => ({ message: 'OpenAi API key saved' }));
    }

    public saveMailServer (params: MailServerParams) {
        const transport = nodemailer.createTransport({
            host: params.host,
            port: params.port,
            secure: params.port === 465,
            auth: {
                user: params.user,
                pass: params.pass,
            },
        });

        const validate = TaskEither
            .tryCatch(
                () => transport.verify(),
                'Invalid mail server config',
            )
            .mapError(() => createBadRequestError('Invalid mail server config'));

        return this.retrieveService.getMailConfig()
            .flip(
                () => validate,
                () => createBadRequestError('Mail server config already set'),
            )
            .chain((valid) => valid)
            .chain(() => this.retrieveService.setMailConfig(params.host, params.port, params.user, params.pass, params.domain))
            .map(() => ({ message: 'Mail server config saved' }));
    }

    public saveOpenSubtitles (params: OpenSubtitlesParams) {
        const openSubtitles = new OS({
            useragent: params.userAgent,
            username: params.username,
            password: params.password,
            ssl: true,
        });

        const validate = TaskEither
            .tryCatch(
                () => openSubtitles.login(),
                'Invalid OpenSubtitles config',
            )
            .filter(
                (result) => Boolean(result.token),
                () => createBadRequestError('Invalid OpenSubtitles config'),
            );

        return this.retrieveService.getOpenSubtitlesConfig()
            .flip(
                () => validate,
                () => createBadRequestError('OpenSubtitles config already set'),
            )
            .chain((valid) => valid)
            .chain(() => this.retrieveService.setOpenSubtitlesConfig(params))
            .map(() => ({ message: 'OpenSubtitles config saved' }));
    }

    public saveAdminAccount (params: AdminAccountParams) {
        const retrieveExisting = (task: TaskEither<User>) => TaskEither
            .tryCatch(
                () => this.prismaService.user.findFirst({
                    where: {
                        role: Role.ADMIN,
                    },
                }),
                'Failed to retrieve existing admin',
            )
            .nonNullable('Admin account already exists')
            .orElse(() => task);

        return TaskEither
            .tryCatch(() => bcrypt.hash(params.password, 10), 'Failed to hash password')
            .map((password) => ({
                email: params.email,
                username: params.username,
                password,
            }))
            .chain((params) => TaskEither
                .tryCatch(
                    () => this.prismaService.user.create({
                        data: {
                            email: params.email,
                            username: params.username,
                            password: params.password,
                            role: Role.ADMIN,
                            confirmedEmail: true,
                        },
                    }),
                    'Failed to upsert admin user',
                ))
            .mapValue(retrieveExisting)
            .chain(() => this.retrieveService.setAdminEmail(params.email))
            .map(() => ({ message: 'Admin account saved' }));
    }

    public getTrendingBackdrops () {
        const getTrending = (type: MediaType, tmdbApi: TmDBApi) => (time: 'day' | 'week') => TaskEither
            .tryCatch(
                () => tmdbApi.getTrendingMedia({
                    language: this.languageService.defaultLanguage.alpha2,
                    library_type: type,
                    time_window: time,
                }),
                'Error getting trending media',
            )
            .map((result) => result.results);

        const trending = (tmdbApi: TmDBApi) => (type: MediaType) => TaskEither
            .of(['day', 'week'])
            .chainItems(getTrending(type, tmdbApi))
            .map((x) => x.flat())
            .distinct('id');

        return this.retrieveService.getTmdbApiKey()
            .map((key) => new TmDBApi(key, fetch))
            .chain((tmdbApi) => TaskEither
                .of([MediaType.MOVIE, MediaType.SHOW])
                .chainItems(trending(tmdbApi)))
            .map((x) => x.flat())
            .sortBy('popularity', 'desc')
            .filterItems((media) => Boolean(media.backdrop_path))
            .mapItems((media) => `https://image.tmdb.org/t/p/original${media.backdrop_path}`)
            .map((backdrops) => backdrops.slice(0, 20));
    }

    public getOauthUrl (params: OauthClientParams, endpoint: string) {
        const state = uuid();

        return this.cacheStore.set(
            `${SETUP_OAUTH_CACHE_KEY}:${state}`,
            params,
            60 * 60,
        )
            .map(() => this.getRedirectUri(params, endpoint, state))
            .map((message) => ({ message }));
    }

    public handleOauthCallback (code: string, state: string, endpoint: string) {
        const generateHTML = <T extends object>(params: T) => `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <title>Frames OAuth</title>
                    <meta charset="UTF-8" />
                </head>
                <body>
                    <div>Redirecting...</div>
                    <script>
                        const message = JSON.parse('${JSON.stringify(params)}');
                        const sendMessage = (message) => {
                            try {
                                window.opener.postMessage(message, '*');
                            } catch (e) {
                                console.log(e);
                            } finally {
                                window.close();
                            }
                        };
                        
                        window.onload = () => sendMessage(message);
                    </script>
                </body>
            </html>
        `;

        const saveOauthData = (params: OauthClientParams) => (data: { refresh_token: string }) => TaskEither
            .tryCatch(
                () => this.prismaService.cloudStorage.create({
                    data: {
                        name: params.name,
                        drive: params.provider === OauthProvider.DRIVE ?
                            CloudDrive.GDRIVE :
                            CloudDrive.DROPBOX,
                        credentials: JSON.stringify({
                            clientId: params.clientId,
                            clientSecret: params.clientSecret,
                            refreshToken: data.refresh_token,
                        }),
                    },
                }),
                'Failed to save oauth data',
            )
            .map((storage) => ({
                storageId: storage.id,
                provider: params.provider,
            }));

        return this.cacheStore.get<OauthClientParams>(`${SETUP_OAUTH_CACHE_KEY}:${state}`)
            .nonNullable('Oauth session not found')
            .chain((params) => this.getOauthData(params, code, endpoint)
                .chain(saveOauthData(params)))
            .map(generateHTML);
    }

    public readFolder (params: ReadFolderArgs) {
        const files = this.storageService.readFolder(params.cloudStorageId, params.path);
        const folder = TaskEither
            .of(params.path)
            .matchTask([
                {
                    predicate: (path) => Boolean(path),
                    run: (path) => this.storageService.getFile(params.cloudStorageId, path!),
                },
                {
                    predicate: (path) => !path,
                    run: () => TaskEither.of({
                        path: '',
                        size: 0,
                        name: 'Home',
                        mimeType: null,
                        isFolder: true,
                        modifiedAt: new Date(),
                        cloudStorageId: params.cloudStorageId,
                    }),
                },
            ]);

        return TaskEither
            .fromBind({
                files,
                folder,
            })
            .map(({ files, folder }) => ({
                ...folder,
                items: files,
            }));
    }

    public createLocalStorage (name: string) {
        const retrieveExisting = (task: TaskEither<CloudStorage>) => TaskEither
            .tryCatch(
                () => this.prismaService.cloudStorage.findFirst({
                    where: {
                        drive: CloudDrive.LOCAL,
                    },
                }),
                'Failed to retrieve existing storage',
            )
            .nonNullable('Local storage already exists')
            .orElse(() => task);

        return TaskEither
            .tryCatch(
                () => this.prismaService.cloudStorage.create({
                    data: {
                        name,
                        drive: CloudDrive.LOCAL,
                        credentials: JSON.stringify({
                            root: '/',
                        }),
                    },
                }),
                'Failed to create local storage',
            )
            .mapValue(retrieveExisting)
            .map((storage): SlimStorageSchema => ({
                id: storage.id,
                name: storage.name,
                drive: storage.drive,
            }));
    }

    public createS3Storage ({ name, ...params }: S3Params) {
        return TaskEither
            .tryCatch(
                () => this.storageService
                    .baseStorageService
                    .createProvider({
                        provider: Provider.S3,
                        options: params,
                    })
                    .readFolder(),
            )
            .filter(
                (files) => files.length > 0,
                () => createBadRequestError('Failed to read S3 bucket'),
            )
            .chain(() => TaskEither
                .tryCatch(
                    () => this.prismaService.cloudStorage.create({
                        data: {
                            name,
                            drive: CloudDrive.S3,
                            credentials: JSON.stringify(params),
                        },
                    }),
                ))
            .map((storage): SlimStorageSchema => ({
                id: storage.id,
                name: storage.name,
                drive: storage.drive,
            }));
    }

    public updateStorage (params: UpdateSetupStorageArgs) {
        return TaskEither
            .tryCatch(
                () => this.prismaService.cloudStorage.update({
                    where: {
                        id: params.cloudStorageId,
                    },
                    data: {
                        movieLocations: params.movieLocations,
                        showLocations: params.showLocations,
                    },
                }),
                'Failed to update storage',
            )
            .map((storage) => this.pubSubService.publish(STORAGE_ADDED_EVENT, storage))
            .map(() => ({ message: 'Storage updated' }));
    }

    public getConfigurationState () {
        const toConfigured = (task: TaskEither<unknown>) => task
            .map(() => true)
            .orElse(() => TaskEither.of(false));

        const storageCount = TaskEither
            .tryCatch(
                () => this.prismaService.cloudStorage.count(),
                'Failed to retrieve storage length',
            );

        const tmdb = this.retrieveService.getTmdbApiKey().mapValue(toConfigured);
        const fanArt = this.retrieveService.getFanArtApiKey().mapValue(toConfigured);
        const openAi = this.retrieveService.getOpenAiApiKey().mapValue(toConfigured);
        const mail = this.retrieveService.getMailConfig().mapValue(toConfigured);
        const openSubtitles = this.retrieveService.getOpenSubtitlesConfig().mapValue(toConfigured);
        const adminEmail = this.retrieveService.getAdminEmail().mapValue(toConfigured);

        return TaskEither
            .fromBind({
                tmdb,
                fanArt,
                openAi,
                mail,
                openSubtitles,
                adminEmail,
                storageCount,
            })
            .map(({
                tmdb,
                fanArt,
                openAi,
                mail,
                openSubtitles,
                adminEmail,
                storageCount,
            }): SetupConfigurationSchema => ({
                tmdbConfigured: tmdb,
                fanArtConfigured: fanArt,
                openaiConfigured: openAi,
                adminConfigured: adminEmail,
                mailServerConfigured: mail,
                storagesConfigured: storageCount,
                openSubtitlesConfigured: openSubtitles,
            }));
    }

    private encodeObject (object: Record<string, string | number | undefined>) {
        return Object.keys(object)
            .map((key) => {
                if (object[key] === undefined) {
                    return '';
                }

                return `${encodeURIComponent(key)}=${encodeURIComponent(object[key]!)}`;
            })
            .join('&');
    }

    private getRedirectUri (params: OauthClientParams, endpoint: string, state: string) {
        let oauthParams: Record<string, string | number | undefined>;
        const redirectUri = this.getRedirectUrl(endpoint);
        let authUrl: string;

        if (params.provider === OauthProvider.DRIVE) {
            authUrl = 'https://accounts.google.com/o/oauth2/auth';
            oauthParams = {
                client_id: params.clientId,
                redirect_uri: redirectUri,
                response_type: 'code',
                access_type: 'offline',
                scope: 'https://www.googleapis.com/auth/drive',
                state,
            };
        } else {
            authUrl = 'https://www.dropbox.com/oauth2/authorize';
            oauthParams = {
                state,
                client_id: params.clientId,
                redirect_uri: redirectUri,
                response_type: 'code',
                token_access_type: 'offline',
                scope: 'files.metadata.read files.content.read files.content.write files.metadata.write',
            };
        }

        return `${authUrl}?${this.encodeObject(oauthParams)}`;
    }

    private getRedirectUrl (endpoint: string) {
        return `${endpoint}/api/setup/oauth/callback`;
    }

    private getOauthData (params: OauthClientParams, code: string, endpoint: string) {
        const task = (tokenPath: string) => this.httpService
            .postSafe(
                tokenPath,
                z.object({
                    access_token: z.string(),
                    refresh_token: z.string(),
                }),
                this.encodeObject({
                    code,
                    grant_type: 'authorization_code',
                    client_id: params.clientId,
                    client_secret: params.clientSecret,
                    redirect_uri: this.getRedirectUrl(endpoint),
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            );


        return Either
            .of(params.provider)
            .match([
                {
                    predicate: (provider) => provider === OauthProvider.DRIVE,
                    run: () => 'https://www.googleapis.com/oauth2/v4/token',
                },
                {
                    predicate: (provider) => provider === OauthProvider.DROPBOX,
                    run: () => 'https://api.dropboxapi.com/oauth2/token',
                },
            ])
            .toTaskEither()
            .chain(task);
    }
}
