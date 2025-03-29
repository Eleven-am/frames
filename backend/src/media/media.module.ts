import { Global, Module } from '@nestjs/common';

import { MediaAuthorizer } from './media.authorizer';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { RecommendationsService } from './recommendations.service';

@Global()
@Module({
    controllers: [MediaController],
    providers: [MediaService, MediaAuthorizer, RecommendationsService],
    exports: [MediaService, RecommendationsService],
})
export class MediaModule {}
