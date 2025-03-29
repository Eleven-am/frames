import { accessibleBy } from '@casl/prisma';
import { AppAbilityType, Action } from '@eleven-am/authorizer';
import { TaskEither } from '@eleven-am/fp';
import { StorageService } from '@eleven-am/nestjs-storage';
import { Injectable, StreamableFile } from '@nestjs/common';
import { AuthKey, User, UseCase, Download, Media, Episode } from '@prisma/client';
import { Response } from 'express';
import { Readable } from 'stream';
import { AuthKeyService } from '../authkey/authkey.service';
import { LanguageReturn } from '../language/language.types';
import { RecommendationsService } from '../media/recommendations.service';
import { Playback } from '../playback/playback.schema';
import { PrismaService } from '../prisma/prisma.service';

import { GRACE_PERIOD } from './downloads.constants';
import { DownloadItemSchema } from './downloads.contracts';

@Injectable()
export class DownloadsService {
    constructor (
        private readonly prisma: PrismaService,
        private readonly authKeyService: AuthKeyService,
        private readonly storageService: StorageService,
        private readonly recommendationsService: RecommendationsService,
    ) {}

    /**
     * @desc Create a download
     * @param playback - The playback to create the download for
     * @param authKey - The authKey to create the download for
     * @param user - The user to create the download for
     */
    create (playback: Playback, authKey: AuthKey, user: User) {
        return TaskEither
            .tryCatch(
                () => this.prisma.download.create({
                    data: {
                        view: { connect: { id: playback.id } },
                        authKey: { connect: { id: authKey.id } },
                        user: { connect: { id: user.id } },
                    },
                }),
                'Failed to create download',
            )
            .chain((download) => this.authKeyService.revokeAuthKey(authKey.authKey, user.id, UseCase.DOWNLOAD, playback.id).map(() => download))
            .map((download) => ({
                id: download.id,
                location: download.location,
            }));
    }

    /**
     * @desc Download a file
     * @param download - The download to download
     * @param res - The response to download the file to
     * @param lang - The language to download the file in
     */
    downloadFile (download: Download, res: Response, lang: LanguageReturn) {
        const setHeaders = (name: string, episodeName: string | null) => (stream: NodeJS.ReadableStream) => {
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${name}${episodeName ? ` - ${episodeName}` : ''}.mp4"`);

            return new StreamableFile(stream as Readable);
        };

        return TaskEither
            .tryCatch(
                () => this.prisma.view.findUnique({
                    where: {
                        id: download.viewId,
                    },
                    include: {
                        video: {
                            include: {
                                media: true,
                                episode: true,
                            },
                        },
                    },
                }),
                'Failed to get video',
            )
            .nonNullable('Video not found')
            .chain((view) => this.recommendationsService.getTmdbVideoDetails(view.video.media, lang, view.video.episode)
                .map((media) => ({
                    view,
                    media,
                })))
            .chain(({ view, media }) => TaskEither
                .tryCatch(
                    () => this.storageService.readFile(view.video.location),
                    'Failed to stream file',
                )
                .map(setHeaders(media.name, media.episodeName)));
    }

    /**
     * @desc List downloads
     * @param ability - The ability to check access
     * @param lang - The language to list the downloads in
     */
    listDownloads (ability: AppAbilityType, lang: LanguageReturn) {
        const now = new Date();
        const mapDownload = (download: Download, media: Media, episode: Episode | null) => this.recommendationsService
            .getTmdbVideoDetails(media, lang, episode)
            .map((video): DownloadItemSchema => ({
                id: media.id,
                name: video.name,
                type: media.type,
                backdrop: media.backdrop,
                location: download.location,
                episodeName: video.episodeName,
                backdropBlur: media.backdropBlur,
                createdAt: download.created.toISOString(),
                isAccessible: (now.getTime() - download.created.getTime()) < GRACE_PERIOD,
            }));

        return TaskEither
            .tryCatch(
                () => this.prisma.download.findMany({
                    where: accessibleBy(ability, Action.Read).Download,
                    include: {
                        view: {
                            include: {
                                video: {
                                    include: {
                                        media: true,
                                        episode: true,
                                    },
                                },
                            },
                        },
                    },
                }),
                'Failed to list downloads',
            )
            .chainItems((download) => mapDownload(download, download.view.video.media, download.view.video.episode));
    }
}
