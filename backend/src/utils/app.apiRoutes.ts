import { RouterModule } from '@nestjs/core';

import { AuthModule } from '../authentication/auth.module';
import { AuthKeyModule } from '../authkey/authkey.module';
import { DownloadsModule } from '../downloads/downloads.module';
import { FramesModule } from '../frames/frames.module';
import { GroupsModule } from '../groups/groups.module';
import { ListsModule } from '../lists/lists.module';
import { MediaModule } from '../media/media.module';
import { OauthModule } from '../oauth/oauth.module';
import { PicksModule } from '../picks/picks.module';
import { PlaybackModule } from '../playback/playback.module';
import { PlaylistsModule } from '../playlists/playlists.module';
import { RatingModule } from '../rating/rating.module';
import { RoomsModule } from '../rooms/rooms.module';
import { ScannerModule } from '../scanner/scanner.module';
import { SeenModule } from '../seen/seen.module';
import { SetupModule } from '../setup/setup.module';
import { StorageModule } from '../storage/storage.module';
import { StreamModule } from '../stream/stream.module';
import { SubtitlesModule } from '../subtitles/subtitles.module';
import { UsersModule } from '../users/users.module';

export const AppApiRoutes = RouterModule
    .register([
        {
            path: 'api',
            children: [
                AuthModule,
                AuthKeyModule,
                DownloadsModule,
                FramesModule,
                GroupsModule,
                ListsModule,
                MediaModule,
                OauthModule,
                PicksModule,
                PlaybackModule,
                PlaylistsModule,
                RatingModule,
                RoomsModule,
                ScannerModule,
                SeenModule,
                SetupModule,
                StorageModule,
                StreamModule,
                SubtitlesModule,
                UsersModule,
            ],
        },
    ]);
