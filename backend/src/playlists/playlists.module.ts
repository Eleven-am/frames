import { Module } from '@nestjs/common';

import { PlaylistsAuthorizer } from './playlists.authorizer';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';

@Module({
    controllers: [PlaylistsController],
    providers: [PlaylistsService, PlaylistsAuthorizer],
    exports: [PlaylistsService],
})
export class PlaylistsModule {}

