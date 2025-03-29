import { Module } from '@nestjs/common';

import { SubtitlesAuthorizer } from './subtitles.authorizer';
import { SubtitlesController } from './subtitles.controller';
import { SubtitlesService } from './subtitles.service';

@Module({
    controllers: [SubtitlesController],
    providers: [SubtitlesService, SubtitlesAuthorizer],
})
export class SubtitlesModule {}
