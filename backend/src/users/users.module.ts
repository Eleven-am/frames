import { Global, Module } from '@nestjs/common';

import { UserAuthorizer } from './user.authorizer';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Global()
@Module({
    controllers: [UsersController],
    providers: [UserAuthorizer, UsersService],
    exports: [UsersService],
})
export class UsersModule {}
