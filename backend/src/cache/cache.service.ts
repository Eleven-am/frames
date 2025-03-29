import { TaskEither, Either } from '@eleven-am/fp';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';
import { ZodType } from 'zod';

import { REDIS_HOST, REDIS_PORT, REDIS_DB } from '../config/constants';

@Injectable()
export class CacheService {
    private readonly redis: IORedis;

    constructor (configService: ConfigService) {
        this.redis = new IORedis({
            host: configService.getOrThrow<string>(REDIS_HOST),
            port: parseInt(configService.getOrThrow<string>(REDIS_PORT), 10),
            db: parseInt(configService.getOrThrow<string>(REDIS_DB), 10),
        });
    }

    /**
   * Delete a key from the cache, this can be a string or an array of strings and the key might be a pattern
   * @param key - The key to delete
   * @returns Promise<number> - Number of keys deleted
   * @throws Error if deletion fails
   */
    del (key: string | string[]): TaskEither<number> {
        return TaskEither
            .of(key)
            .matchTask([
                {
                    predicate: (key) => Array.isArray(key),
                    run: (key) => TaskEither.tryCatch(() => this.redis.del(...key), 'Failed to delete key(s) from cache'),
                },
                {
                    predicate: (key) => key.includes('*') || key.includes('?'),
                    run: (key) => TaskEither
                        .tryCatch(() => this.redis.keys(key as string))
                        .match([
                            {
                                predicate: (keys) => keys.length === 0,
                                run: () => Promise.resolve(0),
                            },
                            {
                                predicate: () => true,
                                run: (keys) => this.redis.unlink(...keys),
                            },
                        ]),
                },
                {
                    predicate: () => true,
                    run: (key) => TaskEither.tryCatch(() => this.redis.del(key as string), 'Failed to delete key(s) from cache'),
                },
            ]);
    }

    /**
   * Get a value from the cache
   * @param key - The key to get
   * @param schema - The schema to validate the data against
   * @returns Promise<DataType | null> - The value from cache or null if not found
   * @throws Error if retrieval fails or validation fails
   */
    get<DataType> (key: string, schema?: ZodType<DataType>): TaskEither<DataType> {
        return TaskEither
            .tryCatch(() => this.redis.get(key))
            .nonNullable('No data found in cache')
            .map((data) => Either.tryCatch(() => JSON.parse(data), 'Failed to parse cache data'))
            .matchTask([
                {
                    predicate: () => schema !== undefined,
                    run: (either) => either.parseSchema(schema!).toTaskEither(),
                },
                {
                    predicate: () => true,
                    run: (either) => either.toTaskEither(),
                },
            ]);
    }

    /**
   * Set a value in the cache
   * @param key - The key to set
   * @param value - The value to set
   * @param ttl - The time to live in seconds
   * @returns Promise<'OK' | null> - Redis response
   * @throws Error if setting fails
   */
    set (key: string, value: any, ttl?: number): TaskEither<'OK'> {
        return Either
            .tryCatch(() => JSON.stringify(value), 'Failed to serialize cache data')
            .toTaskEither()
            .match([
                {
                    predicate: () => ttl !== undefined,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    run: (serializedValue) => this.redis.set(key, serializedValue, 'EX', ttl),
                }, {
                    predicate: () => true,
                    run: (serializedValue) => this.redis.set(key, serializedValue),
                },
            ]);
    }
}
