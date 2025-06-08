import {
    AuthorizationModule,
    AuthorizationHttpGuard,
    RedirectFilter,
    AuthenticationInterceptor,
} from '@eleven-am/authorizer';
import { PondSocketModule } from '@eleven-am/pondsocket-nest';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AuthModule } from './authentication/auth.module';
import { AuthKeyModule } from './authkey/authkey.module';
import { CacheModule } from './cache/cache.module';
import { authorizationOptions } from './config/authorizationOptions';
import { BullOptions } from './config/redisOptions';
import { socketOptions } from './config/socketOptions';
import { DownloadsModule } from './downloads/downloads.module';
import { FramesModule } from './frames/frames.module';
import { GroupsModule } from './groups/groups.module';
import { HealthModule } from './health/health.module';
import { LanguageModule } from './language/language.module';
import { ListsModule } from './lists/lists.module';
import { MediaModule } from './media/media.module';
import { MiscModule } from './misc/misc.module';
import { NotificationModule } from './notifications/notification.module';
import { OauthModule } from './oauth/oauth.module';
import { PicksModule } from './picks/picks.module';
import { PlaybackModule } from './playback/playback.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { PrismaModule } from './prisma/prisma.module';
import { RatingModule } from './rating/rating.module';
import { RenderModule } from './render/render.module';
import { RoomsModule } from './rooms/rooms.module';
import { ScannerModule } from './scanner/scanner.module';
import { SeenModule } from './seen/seen.module';
import { SessionModule } from './session/session.module';
import { SetupGuard } from './setup/setup.guard';
import { SetupModule } from './setup/setup.module';
import { SocketModule } from './socket/socket.module';
import { StorageModule } from './storage/storage.module';
import { StreamModule } from './stream/stream.module';
import { SubtitlesModule } from './subtitles/subtitles.module';
import { UsersModule } from './users/users.module';
import { AppApiRoutes } from './utils/app.apiRoutes';

@Module({
    imports: [
        AppApiRoutes,
        AuthKeyModule,
        AuthModule,
        AuthorizationModule.forRootAsync(authorizationOptions),
        BullModule.forRootAsync(BullOptions),
        ConfigModule.forRoot({ isGlobal: true }),
        CacheModule,
        DownloadsModule,
        EventEmitterModule.forRoot(),
        FramesModule,
        GroupsModule,
        HealthModule,
        LanguageModule,
        ListsModule,
        MediaModule,
        NotificationModule,
        OauthModule,
        PicksModule,
        PlaybackModule,
        PlaylistsModule,
        PondSocketModule.forRootAsync(socketOptions),
        PrismaModule,
        RatingModule,
        RoomsModule,
        ScannerModule,
        SeenModule,
        SessionModule,
        SetupModule,
        SocketModule,
        StreamModule,
        StorageModule,
        SubtitlesModule,
        UsersModule,
        MiscModule,
        RenderModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AuthorizationHttpGuard,
        },
        {
            provide: APP_GUARD,
            useClass: SetupGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: AuthenticationInterceptor,
        },
        {
            provide: APP_FILTER,
            useClass: RedirectFilter,
        },
    ],
})
export class AppModule {}
