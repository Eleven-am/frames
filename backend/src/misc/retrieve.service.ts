import {TaskEither, createBadRequestError, Either} from '@eleven-am/fp';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { JWT_SECRET } from '../config/constants';
import { PrismaService } from '../prisma/prisma.service';
import { MailData } from '../setup/setup.contracts';

import {
    ADMIN_EMAIL_KEY,
    FAN_ART_API_KEY,
    MAIL_HOST_KEY,
    MAIL_PASS_KEY,
    MAIL_PORT_KEY,
    MAIL_USER_KEY,
    OPEN_AI_API_KEY,
    OPEN_SUBTITLES_PASSWORD_KEY,
    OPEN_SUBTITLES_USER_AGENT_KEY,
    OPEN_SUBTITLES_USERNAME_KEY,
    TMDB_API_KEY,
    OPEN_AI_KEY_UPDATED_EVENT,
    TMDB_KEY_UPDATED_EVENT,
    OPEN_SUBTITLES_KEY_UPDATED_EVENT,
    WEB_AUTHN_ENABLED,
    FAN_ART_KEY_UPDATED_EVENT,
    NODEMAILER_CONFIG_UPDATED_EVENT,
    MAIL_DOMAIN_KEY,
} from './misc.constants';
import { PubSubService } from './pubsub.service';

@Injectable()
export class RetrieveService {
    private readonly ENCRYPTION_KEY: Buffer;

    private readonly IV_LENGTH = 16;

    private allConfigured: boolean;

    constructor (
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
        private readonly pubSubService: PubSubService,
    ) {
        this.ENCRYPTION_KEY = crypto.scryptSync(
            this.configService.getOrThrow<string>(JWT_SECRET),
            'salt',
            32,
        );
    }

    get tmdbApiKey () {
        return this.getTmdbApiKey()
            .orElse(() => TaskEither.of(''));
    }

    get fanArtApiKey () {
        return this.getFanArtApiKey()
            .orElse(() => TaskEither.of(''));
    }

    get openAiApiKey () {
        return this.getOpenAiApiKey()
            .orElse(() => TaskEither.of(''));
    }

    get adminEmail () {
        return this.getAdminEmail()
            .orElse(() => TaskEither.of(''));
    }

    get mailConfig () {
        return this.getMailConfig()
            .map(
                ({
                     host,
                     port,
                     user,
                     pass,
                     domain
                 }): MailData => ({
                    domain,
                    config: {
                        host,
                        port,
                        secure: port === 465,
                        auth: {
                            user,
                            pass,
                        },
                    }
                }),
            );
    }

    get openSubtitlesConfig () {
        return this.getOpenSubtitlesConfig();
    }

    isConfigured () {
        const storageLength = TaskEither.tryCatch(
            () => this.prismaService.cloudStorage.count(),
            'Failed to retrieve storage length',
        );

        const configured = TaskEither.fromBind({
            tmdbApiKey: this.tmdbApiKey,
            fanArtApiKey: this.fanArtApiKey,
            openAiApiKey: this.openAiApiKey,
            adminEmail: this.adminEmail,
            storageLength,
        })
            .filter(
                ({
                     tmdbApiKey,
                     fanArtApiKey,
                     openAiApiKey,
                     adminEmail,
                     storageLength,
                 }) =>
                    Boolean(tmdbApiKey) &&
                    Boolean(fanArtApiKey) &&
                    Boolean(openAiApiKey) &&
                    Boolean(adminEmail) &&
                    storageLength > 0,
                () =>
                    createBadRequestError(
                        'Not all required environment variables are set',
                    ),
            )
            .map(() => true)
            .orElse(() => TaskEither.of(false))
            .ioSync((configured) => {
                this.allConfigured = configured;
            });

        return TaskEither
            .of(this.allConfigured)
            .matchTask([
                {
                    predicate: (configured) => configured === undefined || !configured,
                    run: () => configured,
                },
                {
                    predicate: () => true,
                    run: (configured) => TaskEither.of(configured),
                },
            ]);
    }

    setTmdbApiKey (value: string) {
        return this.setEnvValue(TMDB_API_KEY, value)
            .chain(() =>
                this.pubSubService.publish(TMDB_KEY_UPDATED_EVENT, {
                    apiKey: value,
                }),
            );
    }

    getTmdbApiKey () {
        return this.getFromEnvOrDB(TMDB_API_KEY);
    }

    setFanArtApiKey (value: string) {
        return this.setEnvValue(FAN_ART_API_KEY, value)
            .chain(() =>
                this.pubSubService.publish(FAN_ART_KEY_UPDATED_EVENT, {
                    apiKey: value,
                }),
            );
    }

    getFanArtApiKey () {
        return this.getFromEnvOrDB(FAN_ART_API_KEY);
    }

    setOpenAiApiKey (value: string) {
        return this.setEnvValue(OPEN_AI_API_KEY, value)
            .chain(() =>
                this.pubSubService.publish(OPEN_AI_KEY_UPDATED_EVENT, {
                    apiKey: value,
                }),
            );
    }

    getOpenAiApiKey () {
        return this.getFromEnvOrDB(OPEN_AI_API_KEY);
    }

    setAdminEmail (value: string) {
        return this.setEnvValue(ADMIN_EMAIL_KEY, value);
    }

    getAdminEmail () {
        return this.getEnvValue(ADMIN_EMAIL_KEY);
    }

    setMailConfig (host: string, port: number, user: string, pass: string, domain: string) {
        return TaskEither
            .fromBind({
                host: this.setEnvValue(MAIL_HOST_KEY, host),
                port: this.setEnvValue(MAIL_PORT_KEY, port.toString()),
                user: this.setEnvValue(MAIL_USER_KEY, user),
                pass: this.setEnvValue(MAIL_PASS_KEY, pass),
                domain: this.setEnvValue(MAIL_DOMAIN_KEY, domain),
            })
            .chain(() =>
                this.pubSubService.publish(NODEMAILER_CONFIG_UPDATED_EVENT, {
                    host,
                    domain,
                    port,
                    user,
                    pass,
                }),
            );
    }

    getMailConfig () {
        return TaskEither
            .fromBind({
                host: this.getEnvValue(MAIL_HOST_KEY),
                port: this.getEnvValue(MAIL_PORT_KEY).map((port) => parseInt(port, 10)),
                user: this.getEnvValue(MAIL_USER_KEY),
                pass: this.getEnvValue(MAIL_PASS_KEY),
                domain: this.getEnvValue(MAIL_DOMAIN_KEY),
            });
    }

    setOpenSubtitlesConfig (config: {
        userAgent: string;
        username: string;
        password: string;
    }) {
        return TaskEither
            .fromBind({
                username: this.setEnvValue(OPEN_SUBTITLES_USERNAME_KEY, config.username),
                password: this.setEnvValue(OPEN_SUBTITLES_PASSWORD_KEY, config.password),
                userAgent: this.setEnvValue(OPEN_SUBTITLES_USER_AGENT_KEY, config.userAgent),
            })
            .chain(() =>
                this.pubSubService.publish(OPEN_SUBTITLES_KEY_UPDATED_EVENT, {
                    username: config.username,
                    password: config.password,
                    userAgent: config.userAgent,
                }),
            );
    }

    getOpenSubtitlesConfig () {
        return TaskEither
            .fromBind({
                userAgent: this.getEnvValue(OPEN_SUBTITLES_USER_AGENT_KEY),
                username: this.getEnvValue(OPEN_SUBTITLES_USERNAME_KEY),
                password: this.getEnvValue(OPEN_SUBTITLES_PASSWORD_KEY),
            });
    }

    setWebAuthnEnabled (value: boolean) {
        return this.setEnvValue(WEB_AUTHN_ENABLED, value.toString());
    }

    getWebAuthnEnabled () {
        return this.getEnvValue(WEB_AUTHN_ENABLED)
            .map((value) => value === 'true')
            .orElse(() => TaskEither.of(false));
    }

    private encrypt (value: string) {
        const iv = crypto.randomBytes(this.IV_LENGTH);
        const cipher = crypto.createCipheriv(
            'aes-256-cbc',
            this.ENCRYPTION_KEY,
            iv,
        );
        let encrypted = cipher.update(value, 'utf8', 'hex');

        encrypted += cipher.final('hex');

        return `${iv.toString('hex')}:${encrypted}`;
    }

    private decrypt (value: string) {
        const [iv, encrypted] = value.split(':');
        const decipher = crypto.createDecipheriv(
            'aes-256-cbc',
            this.ENCRYPTION_KEY,
            Buffer.from(iv, 'hex'),
        );
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');

        decrypted += decipher.final('utf8');

        return decrypted;
    }

    private getEnvValue (key: string) {
        return TaskEither
            .tryCatch(
                () =>
                    this.prismaService.config.findUnique({
                        where: {
                            key,
                        },
                    }),
                `Failed to retrieve ${key}`,
            )
            .nonNullable(`No ${key} found`)
            .map((config) => this.decrypt(config.value));
    }

    private setEnvValue (key: string, value: string) {
        return TaskEither
            .tryCatch(
                () =>
                    this.prismaService.config.upsert({
                        where: {
                            key,
                        },
                        create: {
                            key,
                            value: this.encrypt(value),
                        },
                        update: {
                            value: this.encrypt(value),
                        },
                    }),
                `Failed to set ${key}`,
            )
            .io(() => this.isConfigured());
    }

    private getFromEnvOrDB (key: string) {
        return Either
            .tryCatch(() => this.configService.getOrThrow<string>(key), `Failed to retrieve ${key}`)
            .toTaskEither()
            .orElse(() => this.getEnvValue(key));
    }
}
