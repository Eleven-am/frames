import { Module } from '@nestjs/common';

import { RatingAuthorizer } from './rating.authorizer';
import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';

@Module({
    controllers: [RatingController],
    providers: [RatingService, RatingAuthorizer],
})
export class RatingModule {}

