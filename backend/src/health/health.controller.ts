import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import {
    HealthCheck,
    HealthCheckService,
    HttpHealthIndicator,
    MemoryHealthIndicator,
    PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { VersionInfoSchema } from './health.contracts';
import { DockerVersionService } from './heath.update';

import { RedisHealthIndicator } from './redis.health';


@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor (
        private readonly prisma: PrismaService,
        private readonly health: HealthCheckService,
        private readonly http: HttpHealthIndicator,
        private readonly prismaHealth: PrismaHealthIndicator,
        private readonly memory: MemoryHealthIndicator,
        private readonly redisHealth: RedisHealthIndicator,
        private readonly versionService: DockerVersionService,
    ) {}

    @Get('live')
    @HealthCheck()
    liveCheck () {
        return this.health.check([
            () => this.memory.checkHeap('memory_heap', 1024 * 1024 * 1024),
            () => this.memory.checkRSS('memory_rss', 2048 * 1024 * 1024),
        ]);
    }

    @Get('ready')
    @HealthCheck()
    readyCheck () {
        return this.health.check([
            () => this.prismaHealth.pingCheck('prisma', this.prisma),
            () => this.redisHealth.isHealthy('redis'),
        ]);
    }

    @Get('critical')
    @HealthCheck()
    criticalCheck () {
        return this.health.check([
            () => this.http.pingCheck(
                'Tmdb API',
                'https://api.themoviedb.org/3',
                { timeout: 300 }
            ),
            () => this.http.responseCheck(
                'FanArt API',
                'https://webservice.fanart.tv/v3',
                (response) => response.status === 401,
                { timeout: 300 },
            ),
            () => this.http.responseCheck(
                'OpenAI',
                'https://api.openai.com',
                (response) => response.status === 421,
                { timeout: 300 },
            ),
            () => this.http.pingCheck(
                'Ben Dodson',
                'https://itunesartwork.bendodson.com/url.php',
                { timeout: 300 }
            ),
        ]);
    }

    @Get('version')
    @ApiOkResponse({
        description: 'The current version of the application',
        type: VersionInfoSchema,
    })
    version () {
        return this.versionService.isUpToDate();
    }
}
