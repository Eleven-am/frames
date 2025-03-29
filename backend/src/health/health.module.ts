import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from './health.controller';
import { DockerVersionService } from './heath.update';
import { RedisHealthIndicator } from './redis.health';

@Module({
    imports: [TerminusModule],
    controllers: [HealthController],
    providers: [RedisHealthIndicator, DockerVersionService],
})
export class HealthModule {}
