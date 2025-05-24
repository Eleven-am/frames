import { accessibleBy } from '@casl/prisma';
import { Action, AppAbilityType } from '@eleven-am/authorizer';
import { createBadRequestError, sortBy, TaskEither } from '@eleven-am/fp';
import { Injectable } from '@nestjs/common';
import {
    CloudStorage,
    Episode,
    Media,
    MediaType,
    PlaylistVideo,
    Role,
    Subtitle,
    User,
    Video,
    Watched
} from '@prisma/client';
import { Queue } from 'bullmq';

import { COMPLETED_VIDEO_POSITION, PLAYBACK_PREFIX_KEY } from './playback.constants';
import {
    GetPlaybackSessionParams,
    Playback,
    PlaybackData,
    PlaybackSession,
    PlaybackVideo,
    SubtitleData,
    UpdatePlaybackInformSchema,
    UpNextDetails,
} from './playback.schema';
import { CacheService } from '../cache/cache.service';
import { NO_LANGUAGE } from '../language/language.constants';
import { LanguageReturn } from '../language/language.types';
import { TmdbVideoDetails } from '../media/media.contracts';
import { RecommendationsService } from '../media/recommendations.service';
import { OpenSubtitlesService } from '../misc/openSubtitles.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { CachedSession } from '../session/session.contracts';
import { MetadataSchema, PresenceAction } from '../socket/socket.schema';
import { StorageService } from '../storage/storage.service';
import { StreamQueue } from '../stream/stream.constants';
import { StreamService } from '../stream/stream.service';
import { cache } from '../utils/helper.fp';


@Injectable()
export class PlaybackService {
    constructor (
        private readonly prisma: PrismaService,
        private readonly cacheStore: CacheService,
        private readonly streamService: StreamService,
        private readonly storageService: StorageService,
        private readonly openSubtitles: OpenSubtitlesService,
        @StreamQueue() private readonly streamQueue: Queue<Video>,
        private readonly notificationService: NotificationService,
        private readonly recommendationsService: RecommendationsService,
    ) {}

    getPlaybackSession ({ video, cachedSession, playlistVideo = null, percentage, inform = true, isFrame = false }: GetPlaybackSessionParams) {
        const newPercentage = percentage >= COMPLETED_VIDEO_POSITION ? 0 : percentage;
        const canAccessStream = cachedSession.user.role !== Role.GUEST || isFrame;

        const performPresenceCheck = (value: PlaybackData) => this.notificationService
            .getMetadata(cachedSession)
            .filterItems((metadata) => metadata.action === PresenceAction.WATCHING)
            .filter(
                (items) => items.length === 0,
                () => createBadRequestError('User already watching'),
            )
            .map(() => value);

        return this.buildVideoSession(cachedSession.language, video)
            // .chain(performPresenceCheck)
            .chain((session) => this.savePlaybackSession(cachedSession.user, video, playlistVideo, inform)
                .map(
                    (playbackData): PlaybackSession => ({
                        ...session,
                        canAccessStream,
                        percentage: newPercentage,
                        playbackId: playbackData.id,
                        inform: playbackData.inform,
                        autoPlay: cachedSession.user.autoplay,
                    }),
                ))
            .chain((session) => this.createStreamLink(session, video, canAccessStream))
            .ioSync((session) => {
                const metadata: MetadataSchema = {
                    name: session.name,
                    overview: session.overview,
                    poster: session.poster,
                    action: PresenceAction.WATCHING,
                    logo: session.logo,
                    backdrop: session.backdrop,
                    backdropBlur: session.backdropBlur,
                    playbackId: session.playbackId,
                    mediaId: session.mediaId,
                };

                const status = `Watching ${session.name}`;

                this.notificationService.updatePresence(cachedSession, metadata, status);
            });
    }

    saveInformation (user: User, playback: Playback, percentage: number) {
        if (!playback.inform || !user.inform) {
            return TaskEither.error<{ message: string }>(createBadRequestError('Cannot save history'));
        }

        const saveSeenMedia = (video: Video & { media: Media }) => this
            .recommendationsService
            .getNextEpisode(video, video.media)
            .matchTask([
                {
                    predicate: (episode) => episode !== null,
                    run: (episode) => TaskEither
                        .fromNullable(episode)
                        .chain((episode) => TaskEither
                            .tryCatch(
                                () => this.prisma.watched.upsert({
                                    where: {
                                        seenByUser: {
                                            userId: user.id,
                                            videoId: episode.video.id,
                                        },
                                    },
                                    create: {
                                        percentage: 0,
                                        userId: user.id,
                                        episodeId: episode.id,
                                        mediaId: episode.showId,
                                        videoId: episode.video.id,
                                    },
                                    update: {
                                        updated: new Date(),
                                    },
                                }),
                                'Error saving playback session',
                            ))
                        .map(() => ({
                            message: 'Next episode added',
                        })),
                },
                {
                    predicate: (episode) => episode === null,
                    run: () => TaskEither
                        .tryCatch(
                            () => this.prisma.seenMedia.upsert({
                                where: {
                                    seenByUser: {
                                        userId: user.id,
                                        mediaId: video.mediaId,
                                    },
                                },
                                create: {
                                    userId: user.id,
                                    mediaId: video.mediaId,
                                    times: 1,
                                },
                                update: {
                                    times: {
                                        increment: 1,
                                    },
                                },
                            }),
                            'Error updating media as seen',
                        )
                        .map(() => ({
                            message: 'All episodes seen',
                        })),
                },
            ]);

        const getWatchedVideo = (watched: Watched) => TaskEither
            .tryCatch(
                () => this.prisma.video.findUnique({
                    where: { id: watched.videoId },
                    include: { media: true },
                }),
                'Error updating media as seen',
            )
            .nonNullable('Video not found')
            .chain(saveSeenMedia);

        return TaskEither
            .tryCatch(
                () => this.prisma.watched.upsert({
                    where: {
                        seenByUser: {
                            userId: user.id,
                            videoId: playback.videoId,
                        },
                    },
                    create: {
                        percentage,
                        userId: user.id,
                        videoId: playback.videoId,
                        episodeId: playback.episodeId,
                        mediaId: playback.video.mediaId,
                        times: percentage >= COMPLETED_VIDEO_POSITION ? 1 : 0,
                    },
                    update: {
                        percentage,
                        times: {
                            increment: percentage >= COMPLETED_VIDEO_POSITION ? 1 : 0,
                        },
                    },
                }),
                'Error saving history',
            )
            .matchTask([
                {
                    predicate: (watched) => watched.percentage >= COMPLETED_VIDEO_POSITION,
                    run: getWatchedVideo,
                },
                {
                    predicate: (watched) => watched.percentage < COMPLETED_VIDEO_POSITION,
                    run: () => TaskEither.of({
                        message: 'History saved',
                    }),
                },
            ]);
    }

    getUpNextPlaybackSession (lang: LanguageReturn, ability: AppAbilityType, playback: Playback) {
        return TaskEither
            .tryCatch(
                () => this.prisma.view.findFirst({
                    where: {
                        AND: [
                            { id: playback.id },
                            accessibleBy(ability, Action.Read).View,
                        ],
                    },
                    include: {
                        playlist: true,
                        video: {
                            include: {
                                media: true,
                                episode: true,
                            },
                        },
                    },
                }),
                'Error getting playback session',
            )
            .nonNullable('Playback session not found')
            .matchTask([
                {
                    predicate: (view) => view.playlist !== null,
                    run: (view) => this.getNextPlaylistVideo(view.playlist!, lang, ability),
                },
                {
                    predicate: (view) => view.playlist === null,
                    run: (view) => this.getNextMedia(lang, ability, view.video),
                },
            ]);
    }

    playFromPlaybackSession (cachedSession: CachedSession, playback: Playback) {
        return TaskEither
            .tryCatch(
                () => this.prisma.view.findUnique({
                    where: { id: playback.id },
                    include: {
                        playlist: {
                            include: {
                                playlist: true,
                            },
                        },
                        video: {
                            include: {
                                episode: true,
                                watched: {
                                    where: {
                                        userId: cachedSession.user.id,
                                    },
                                },
                            },
                        },
                    },
                }),
                'Error getting playback session',
            )
            .nonNullable('Playback session not found')
            .chain((view) => this.getPlaybackSession(
                {
                    cachedSession,
                    video: view.video,
                    playlistVideo: view.playlist,
                    percentage: view.video.watched[0]?.percentage ?? 0,
                    inform: view.inform,
                }
            ));
    }

    playFromVideo (cachedSession: CachedSession, video: Video) {
        return TaskEither
            .tryCatch(
                () => this.prisma.video.findUnique({
                    where: {
                        id: video.id,
                    },
                    include: {
                        episode: true,
                        watched: {
                            where: {
                                userId: cachedSession.user.id,
                            },
                        },
                    },
                }),
            )
            .nonNullable('Playback session not found')
            .chain((video) => this.getPlaybackSession(
                {
                    video,
                    cachedSession,
                    percentage: video.watched[0]?.percentage ?? 0,
                    inform: cachedSession.user.inform,
                }
            ));
    }

    deleteWatchHistory (user: User, video: Video) {
        return TaskEither
            .tryCatch(
                () => this.prisma.watched.deleteMany({
                    where: {
                        userId: user.id,
                        videoId: video.id,
                    },
                }),
                'Error deleting watch history',
            )
            .map(() => ({
                message: 'Watch history deleted',
            }));
    }

    addWatchHistory (user: User, video: Video) {
        return TaskEither
            .tryCatch(
                () => this.prisma.watched.upsert({
                    where: {
                        seenByUser: {
                            userId: user.id,
                            videoId: video.id,
                        },
                    },
                    create: {
                        userId: user.id,
                        videoId: video.id,
                        mediaId: video.mediaId,
                        percentage: COMPLETED_VIDEO_POSITION,
                        times: 1,
                    },
                    update: {
                        percentage: COMPLETED_VIDEO_POSITION,
                        times: {
                            increment: 1,
                        },
                    },
                }),
                'Error adding watch history',
            )
            .map(() => ({
                message: 'Watch history added',
            }));
    }

    updateInform (playback: Playback, { inform }: UpdatePlaybackInformSchema) {
        return TaskEither
            .tryCatch(
                () => this.prisma.view.update({
                    where: { id: playback.id },
                    data: { inform },
                }),
                'Error updating inform',
            )
            .map(() => ({ message: 'Inform updated' }));
    }

    private getNextPlaylistVideo (currentVideo: PlaylistVideo, lang: LanguageReturn, ability: AppAbilityType) {
        const getNextMedia = TaskEither
            .tryCatch(
                () => this.prisma.playlistVideo.findUnique({
                    where: {
                        id: currentVideo.id,
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
                'Failed to get next video',
            )
            .nonNullable('No next video')
            .chain((playlistVideo) => this.getNextMedia(lang, ability, playlistVideo.video));

        const getNextPlaylist = TaskEither
            .tryCatch(
                () => this.prisma.playlistVideo.findFirst({
                    where: {
                        AND: [
                            {
                                playlist: {
                                    id: currentVideo.playlistId,
                                    ...accessibleBy(ability, Action.Read).Playlist,
                                },
                            },
                            {
                                index: {
                                    gt: currentVideo.index,
                                },
                            },
                            {
                                video: {
                                    media: accessibleBy(ability, Action.Read).Media,
                                },
                            },
                        ],
                    },
                    orderBy: {
                        index: 'asc',
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
                'Failed to get next video',
            )
            .nonNullable('No next video')
            .chain((playlistVideo) => this.getUpNextSession(playlistVideo.video, lang, playlistVideo));

        return TaskEither
            .fromFirstSuccess(getNextPlaylist, getNextMedia);
    }

    private getUpNextSession (video: Video, language: LanguageReturn, playlistVideo: PlaylistVideo | null = null) {
        return TaskEither
            .tryCatch(
                () => this.prisma.video.findUnique({
                    where: { id: video.id },
                    include: {
                        media: true,
                        episode: true,
                        subtitles: true,
                    },
                }),
                'Error getting video from database',
            )
            .nonNullable('Video not found')
            .chain(
                (realVideo) => this.recommendationsService.getTmdbVideoDetails(
                    realVideo.media,
                    language,
                    realVideo.episode,
                )
                    .map(
                        (tmdbDetails): UpNextDetails => ({
                            backdrop: realVideo.media.backdrop,
                            backdropBlur: realVideo.media.backdropBlur,
                            logo: realVideo.media.logo,
                            logoBlur: realVideo.media.logoBlur,
                            videoId: realVideo.id,
                            mediaId: realVideo.mediaId,
                            name: tmdbDetails.name,
                            type: realVideo.media.type,
                            overview: tmdbDetails.overview,
                            episodeName: tmdbDetails.episodeName,
                            episodeOverview: tmdbDetails.episodeOverview,
                            episodeBackdrop: tmdbDetails.episodeBackdrop,
                            playlistVideoId: playlistVideo?.id ?? null,
                        }),
                    ),
            );
    }

    private buildVideoSession (language: LanguageReturn, video: Video) {
        const getSubtitles = (realVideo: Video & { subtitles: Subtitle[], episode: Episode | null }, tmdbDetails: TmdbVideoDetails) => this
            .storageService
            .getObjectFromVideo(realVideo)
            .chain((file) => this.openSubtitles
                .search({
                    filename: file.name,
                    filesize: file.size,
                    imdbid: tmdbDetails.imdbId,
                    season: realVideo.episode?.season,
                    episode: realVideo.episode?.episode,
                }))
            .chain((subs) => TaskEither
                .tryCatch(
                    () => this.prisma.video.update({
                        where: { id: video.id },
                        data: {
                            subtitles: {
                                createMany: {
                                    data: subs.map((sub) => ({
                                        url: sub.url,
                                        vtt: sub.vtt,
                                        languageCode: sub.languageCode,
                                        languageName: sub.languageName,
                                    })),
                                },
                            },
                        },
                        include: { subtitles: true },
                    }),
                    'Error updating video with subtitles',
                ))
            .map((video): Subtitle[] => video.subtitles);

        const realVideo = TaskEither
            .tryCatch(
                () => this.prisma.video.findUnique({
                    where: { id: video.id },
                    include: {
                        media: true,
                        episode: true,
                        subtitles: true,
                        cloudStorage: true,
                    },
                }),
                'Error getting video from database',
            )
            .nonNullable('Video not found');

        const tmdbDetails = (realVideo: Video & { media: Media, episode: Episode | null }) => this.recommendationsService
            .getTmdbVideoDetails(
                realVideo.media,
                language,
                realVideo.episode,
            );

        const subtitles = (realVideo: Video & { cloudStorage: CloudStorage, subtitles: Subtitle[], episode: Episode | null }, tmdbDetails: TmdbVideoDetails) => TaskEither
            .of(realVideo.subtitles)
            .matchTask([
                {
                    predicate: (subs) => subs.length === 0,
                    run: () => getSubtitles(realVideo, tmdbDetails),
                },
                {
                    predicate: (subs) => subs.length > 0,
                    run: (subs) => TaskEither.of(subs),
                },
            ])
            .map((subs) => ({
                subs,
                link: '',
            }))
            .map(({ subs, link }) => {
                const activeSubtitle = subs.find((sub) => sub.languageCode === language.languageCode);

                return {
                    subs,
                    link,
                    subtitle: activeSubtitle ?? null,
                };
            });

        const mapSubtitles = (subs: Subtitle[]) => {
            const newSubs = sortBy(
                subs.map((sub): SubtitleData => ({
                    language: sub.languageName,
                    subtitleId: sub.id,
                })),
                'language',
                'asc',
            );

            const noLanguage: SubtitleData = {
                language: NO_LANGUAGE,
                subtitleId: '',
            };

            return [noLanguage, ...newSubs];
        };

        return realVideo
            .chain((realVideo) => tmdbDetails(realVideo).map((tmdbDetails) => ({
                realVideo,
                tmdbDetails,
            })))
            .chain(({ realVideo, tmdbDetails }) => subtitles(realVideo, tmdbDetails).map((subtitles) => ({
                realVideo,
                tmdbDetails,
                subtitles,
            })))
            .map(
                ({ realVideo, tmdbDetails, subtitles: { subs, link } }): PlaybackData => ({
                    source: link,
                    mediaId: realVideo.mediaId,
                    name: tmdbDetails.name,
                    episodeName: tmdbDetails.episodeName,
                    overview: tmdbDetails.overview,
                    episodeOverview: tmdbDetails.episodeOverview,
                    episodeBackdrop: tmdbDetails.episodeBackdrop,
                    poster: realVideo.media.poster,
                    backdrop: realVideo.media.backdrop,
                    backdropBlur: realVideo.media.backdropBlur,
                    logo: realVideo.media.logo,
                    logoBlur: realVideo.media.logoBlur,
                    mediaType: realVideo.media.type,
                    videoId: realVideo.id,
                    episodeId: realVideo.episode?.id ?? null,
                    availableSubtitles: mapSubtitles(subs),
                }),
            )
            .io(() => this.sendToStreamQueue(video))
            .mapValue(cache({
                key: `${PLAYBACK_PREFIX_KEY}:${video.id}:${language.alpha2}`,
                store: this.cacheStore,
                ttl: 60 * 60 * 5,
            }));
    }

    private savePlaybackSession (user: User, video: PlaybackVideo, playlistVideo: PlaylistVideo | null, inform: boolean) {
        return TaskEither
            .tryCatch(
                () => this.prisma.view.create({
                    data: {
                        user: { connect: { id: user.id } },
                        video: { connect: { id: video.id } },
                        inform: !user.inform ? false : inform,
                        episode: video.episode ? { connect: { id: video.episode.id } } : undefined,
                        playlist: playlistVideo
                            ? { connect: { id: playlistVideo.id } }
                            : undefined,
                    },
                }),
                'Error saving playback session',
            );
    }

    private createStreamLink (session: PlaybackSession, video: Video, authorised: boolean) {
        const cannotAccessStream = TaskEither
            .of({
                ...session,
                source: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            });

        const canAccessStream = this.streamService.buildStreamUrl(session.playbackId, video)
            .map((source): PlaybackSession => ({
                ...session,
                source,
            }));

        return TaskEither
            .of(authorised)
            .matchTask([
                {
                    predicate: (value) => value,
                    run: () => canAccessStream,
                },
                {
                    predicate: (value) => !value,
                    run: () => cannotAccessStream,
                },
            ]);
    }

    private sendToStreamQueue (video: Video) {
        return TaskEither
            .tryCatch(
                () => this.streamQueue.add(video.location, video),
                'Failed to add video to stream queue',
            );
    }

    private getNextMedia (lang: LanguageReturn, ability: AppAbilityType, item: Video & { media: Media }) {
        return TaskEither
            .fromNullable(item)
            .matchTask([
                {
                    predicate: (view) => view.media.type === MediaType.MOVIE,
                    run: (view) => this.recommendationsService.getNextMovie(ability, view.media, lang),
                },
                {
                    predicate: (view) => view.media.type === MediaType.SHOW,
                    run: (view) => this.recommendationsService.getNextEpisode(view, view.media)
                        .matchTask([
                            {
                                predicate: (episode) => episode !== null,
                                run: (episode) => TaskEither.of({
                                    ...episode!.video,
                                    percentage: 0,
                                }),
                            },
                            {
                                predicate: (episode) => episode === null,
                                run: () => this.recommendationsService.getNextRecommendedVideo(
                                    view.media,
                                    ability,
                                ),
                            },
                        ]),
                },
            ])
            .chain((video) => this.getUpNextSession(video, lang));
    }
}
