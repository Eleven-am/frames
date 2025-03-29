import { TaskEither } from '@eleven-am/fp';
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CloudStorage } from '@prisma/client';
import Redis from 'ioredis';
import { REDIS_DB, REDIS_HOST, REDIS_PORT } from '../config/constants';
import { FanArtKeyEvent } from '../images/images.contracts';
import { STORAGE_ADDED_EVENT } from '../scanner/scanner.constants';
import {
    TMDB_KEY_UPDATED_EVENT,
    OPEN_AI_KEY_UPDATED_EVENT,
    OPEN_SUBTITLES_KEY_UPDATED_EVENT,
    PUB_SUB_CHANNEL_NAME,
    FAN_ART_KEY_UPDATED_EVENT,
    NODEMAILER_CONFIG_UPDATED_EVENT,
} from './misc.constants';
import { TmDBKeyEvent, OpenAIKeyEvent, OpenSubtitlesKeyEvent, NodemailerConfigEvent } from './misc.schema';

export type ConfigEventPayload = {
    [TMDB_KEY_UPDATED_EVENT]: { apiKey: string };
    [FAN_ART_KEY_UPDATED_EVENT]: { apiKey: string };
    [OPEN_AI_KEY_UPDATED_EVENT]: { apiKey: string };
    [STORAGE_ADDED_EVENT]: CloudStorage;
    [OPEN_SUBTITLES_KEY_UPDATED_EVENT]: {
        username: string;
        password: string;
        userAgent: string;
    };
    [NODEMAILER_CONFIG_UPDATED_EVENT]: {
        domain: string;
        host: string;
        port: number;
        user: string;
        pass: string;
    };
};

interface PubSubMessage<T = any> {
    eventName: keyof ConfigEventPayload;
    payload: T;
    timestamp: string;
}

interface ConfigPubSubOptions {
    channelName: string;
    host: string;
    port: number;
    db: number;
}

@Injectable()
export class PubSubService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PubSubService.name);
    private publishClient: Redis;
    private subscribeClient: Redis;
    private readonly options: ConfigPubSubOptions;

    constructor (
        private readonly eventEmitter: EventEmitter2,
        private readonly configService: ConfigService,
    ) {
        this.options = {
            channelName: PUB_SUB_CHANNEL_NAME,
            host: this.configService.getOrThrow<string>(REDIS_HOST),
            port: this.configService.getOrThrow<number>(REDIS_PORT),
            db: parseInt(this.configService.getOrThrow<string>(REDIS_DB), 10),
        };
    }

    /**
     * Initialize Redis connections and subscribe to events
     */
    async onModuleInit () {
        try {
            // Create Redis clients
            this.createRedisClients();

            // Subscribe to the config events channel
            await this.subscribeClient.subscribe(this.options.channelName);
            this.logger.log(`Subscribed to channel: ${this.options.channelName}`);

            // Set up message handler
            this.subscribeClient.on('message', this.handleMessage.bind(this));

            // Handle connection errors
            this.handleConnectionErrors();

            this.logger.log('Config PubSub service initialized successfully');
        } catch (error) {
            this.logger.error(
                'Failed to initialize Config PubSub service',
                error.stack,
            );
            throw error;
        }
    }

    /**
     * Clean up Redis connections when the module is destroyed
     */
    async onModuleDestroy () {
        try {
            if (this.subscribeClient) {
                await this.subscribeClient.unsubscribe(this.options.channelName);
                await this.subscribeClient.quit();
            }

            if (this.publishClient) {
                await this.publishClient.quit();
            }

            this.logger.log('Config PubSub service cleaned up successfully');
        } catch (error) {
            this.logger.error('Error during Config PubSub cleanup', error.stack);
        }
    }

    /**
     * Publish a configuration event to all instances
     *
     * @param eventName - Name of the event to publish
     * @param payload - Payload of the event
     */
    publish<T extends keyof ConfigEventPayload> (
        eventName: T,
        payload: ConfigEventPayload[T],
    ) {
        return TaskEither.of({
            eventName,
            payload,
            timestamp: new Date().toISOString(),
        })
            .map((message) => JSON.stringify(message))
            .chain((message) =>
                TaskEither.tryCatch(
                    () => this.publishClient.publish(this.options.channelName, message),
                    'Failed to publish event',
                ),
            );
    }

    private createRedisClients () {
        const {
            host,
            port,
            db,
        } = this.options;

        const redisOptions = {
            host,
            port,
            db,
        };

        this.publishClient = new Redis(redisOptions);
        this.subscribeClient = new Redis(redisOptions);
    }

    private handleMessage (channel: string, message: string) {
        if (channel !== this.options.channelName) {
            return;
        }

        try {
            const {
                eventName,
                payload,
            } = JSON.parse(message) as PubSubMessage;

            this.logger.debug(`Received event: ${eventName}`, {
                eventName,
            });

            const event = this.createEventObject(eventName, payload);

            this.eventEmitter.emit(eventName, event);
        } catch (error) {
            this.logger.error('Error processing PubSub message', error.stack);
        }
    }

    private createEventObject (eventName: string, payload: any) {
        switch (eventName) {
            case TMDB_KEY_UPDATED_EVENT:
                return new TmDBKeyEvent(payload.apiKey);

            case FAN_ART_KEY_UPDATED_EVENT:
                return new FanArtKeyEvent(payload.apiKey);

            case OPEN_AI_KEY_UPDATED_EVENT:
                return new OpenAIKeyEvent(payload.apiKey);

            case OPEN_SUBTITLES_KEY_UPDATED_EVENT:
                return new OpenSubtitlesKeyEvent(
                    payload.username,
                    payload.password,
                    payload.userAgent,
                );

            case NODEMAILER_CONFIG_UPDATED_EVENT:
                return new NodemailerConfigEvent({
                    host: payload.host,
                    port: payload.port,
                    secure: true,
                    auth: {
                        user: payload.user,
                        pass: payload.pass,
                    },
                }, payload.domain);

            default:
                return payload;
        }
    }

    private handleConnectionErrors () {
        const handleError = (client: Redis, type: string) => {
            client.on('error', (error) => {
                this.logger.error(`Redis ${type} client error`, error.stack);
            });

            client.on('reconnecting', () => {
                this.logger.log(`Redis ${type} client reconnecting...`);
            });
        };

        handleError(this.publishClient, 'publish');
        handleError(this.subscribeClient, 'subscribe');
    }
}
