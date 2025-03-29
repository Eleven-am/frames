import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicator, HealthCheckError } from '@nestjs/terminus';
import Redis from 'ioredis';

import { REDIS_HOST, REDIS_PORT } from '../config/constants';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
    private readonly redisClient: Redis;

    constructor (private readonly configService: ConfigService) {
        super();

        const redisHost = this.configService.getOrThrow<string>(REDIS_HOST);
        const redisPort = parseInt(this.configService.getOrThrow<string>(REDIS_PORT), 10);

        this.redisClient = new Redis({
            host: redisHost,
            port: redisPort,
        });
    }

    /**
     * @desc Check if the redis connection is healthy
     * @param key - The key to check
     */
    async isHealthy (key: string) {
        const isHealthy = await this.getIsHealthy();
        const status = this.getStatus(key, isHealthy, {
            message: !isHealthy ? 'redis is unhealthy' : undefined,
        });

        if (isHealthy) {
            return status;
        }

        throw new HealthCheckError('RedisCheck failed', status);
    }

    private async getIsHealthy () {
        try {
            const data = await this.redisClient.ping();

            return data === 'PONG';
        } catch (error) {
            return false;
        }
    }
}
