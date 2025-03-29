import { Module } from '@nestjs/common';

import { GroupsAuthorizer } from './groups.authorizer';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
    controllers: [GroupsController],
    providers: [GroupsService, GroupsAuthorizer],
})
export class GroupsModule {}
