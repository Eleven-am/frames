import { Module } from '@nestjs/common';


import { ListsAuthorizer } from './lists.authorizer';
import { ListsController } from './lists.controller';
import { ListsService } from './lists.service';
import { PlaylistsModule } from '../playlists/playlists.module';

@Module({
    imports: [PlaylistsModule],
    controllers: [ListsController],
    providers: [ListsService, ListsAuthorizer],
})
export class ListsModule {}
