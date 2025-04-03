import { accessibleBy } from '@casl/prisma';
import { Action, AppAbilityType } from '@eleven-am/authorizer';
import { createBadRequestError, dedupeBy, difference, intersect, shuffle, sortBy, TaskEither } from '@eleven-am/fp';
import { Injectable } from '@nestjs/common';
import { AccessPolicy, Generator, Media, MediaType, Playlist, PlaylistVideo, User, Video } from '@prisma/client';

import {
    CreatePlaylistArgs,
    PlaylistDetails,
    PlaylistForMediaContext,
    PlaylistResponse,
    SharePlaylistArgs,
    UpdatePlaylistArgs,
    VideoItem,
} from './playlists.contracts';
import { PersonResponse } from '../media/media.contracts';
import { MediaService } from '../media/media.service';
import { COMPLETED_VIDEO_POSITION } from '../playback/playback.constants';
import { PlaybackService } from '../playback/playback.service';
import { PrismaService } from '../prisma/prisma.service';
import { CachedSession } from '../session/session.contracts';
import { mapPageResponse } from '../utils/helper.fp';
import { PaginateArgs } from '../utils/utils.contracts';


@Injectable()
export class PlaylistsService {
    constructor (
        private readonly prisma: PrismaService,
        private readonly mediaService: MediaService,
        private readonly playbackService: PlaybackService,
    ) {}

    /**
     * @description Update a playlist from the given parameters
     * @param user - The user updating the playlist
     * @param playlist - The playlist to update
     * @param params - The parameters to update the playlist with
     * @param ability - The ability of the user
     */
    updatePlaylist (user: User, playlist: Playlist, params: UpdatePlaylistArgs, ability: AppAbilityType) {
        const getVideos = (current: Playlist & { playlistVideos: PlaylistVideo[] }) => {
            const dedupeVideos = sortBy(dedupeBy(params.videos, 'index'), 'index', 'asc');
            const videosToDelete = difference(current.playlistVideos, dedupeVideos, 'id', 'id');
            const newVideos = difference(
                dedupeVideos,
                current.playlistVideos,
                'videoId',
                'videoId',
            );

            const videosToUpdate = difference(
                intersect(dedupeVideos, current.playlistVideos, 'id', 'id'),
                current.playlistVideos,
                ['id', 'index'],
                ['id', 'index'],
            );

            return {
                videosToUpdate,
                videosToDelete,
                newVideos,
            };
        };

        const getCurrentPlaylist = TaskEither
            .tryCatch(
                () => this.prisma.playlist.findUnique({
                    where: {
                        id: playlist.id,
                    },
                    include: {
                        playlistVideos: true,
                    },
                }),
                'Failed to get playlist',
            )
            .nonNullable('Playlist not found');

        const performTransaction = ({ videosToDelete, newVideos, videosToUpdate }: ReturnType<typeof getVideos>) => TaskEither
            .tryCatch(
                () => this.prisma.$transaction([
                    this.prisma.playlist.update({
                        where: {
                            id: playlist.id,
                        },
                        data: {
                            name: params.name,
                            overview: params.overview,
                            isPublic: params.isPublic,
                        },
                    }),
                    this.prisma.playlistVideo.deleteMany({
                        where: {
                            id: {
                                'in': videosToDelete.map((video) => video.id),
                            },
                        },
                    }),
                    this.prisma.playlistVideo.createMany({
                        data: newVideos.map((video) => ({
                            videoId: video.videoId,
                            index: video.index,
                            playlistId: playlist.id,
                        })),
                    }),
                    ...videosToUpdate.map((video) => this.prisma.playlistVideo.update({
                        where: {
                            id: video.id,
                        },
                        data: {
                            index: video.index,
                        },
                    })),
                ]),
            );

        return getCurrentPlaylist
            .chain((current) => performTransaction(getVideos(current)))
            .chain(() => this.getPlaylist(playlist, user, ability));
    }

    /**
     * @description Create a playlist from the given parameters
     * @param user - The user creating the playlist
     * @param args - The parameters to create the playlist with
     * @param ability - The ability of the user
     */
    createPlaylist (user: User, args: CreatePlaylistArgs, ability: AppAbilityType) {
        return TaskEither
            .tryCatch(
                () => this.prisma.playlist.create({
                    data: {
                        name: args.name,
                        userId: user.id,
                        overview: args.overview,
                        isPublic: args.isPublic,
                        generator: Generator.USER,
                        playlistVideos: {
                            create: args.videos.map((video) => ({
                                videoId: video.videoId,
                                index: video.index,
                            })),
                        },
                    },
                }),
                'Failed to create playlist',
            )
            .chain((playlist) => this.getPlaylist(playlist, user, ability));
    }

    /**
     * @description Get a playlist from the database and format it to the PlaylistDetails type
     * @param playlist - The playlist to get
     * @param user - The user to get the playlist for
     * @param ability - The ability of the user
     */
    getPlaylist (playlist: Playlist, user: User, ability: AppAbilityType) {
        return TaskEither
            .tryCatch(
                () => this.prisma.playlist.findUnique({
                    where: {
                        id: playlist.id,
                    },
                    include: {
                        user: true,
                        sharedUsers: true,
                        playlistVideos: {
                            where: accessibleBy(ability, Action.Read).PlaylistVideo,
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
                'Failed to get playlist',
            )
            .nonNullable('Playlist not found')
            .map((playlist): PlaylistDetails => {
                const videos = sortBy(playlist
                    .playlistVideos.map((video) => ({
                        id: video.id,
                        index: video.index,
                        playlistId: video.playlistId,
                        videoId: video.videoId,
                        backdrop: video.video.media.backdrop,
                        backdropBlur: video.video.media.backdropBlur,
                        updatedAt: video.updated.toISOString(),
                        name: `${video.video.media.name}${video.video.episode ? ` - S${video.video.episode.season}, E${video.video.episode.episode}` : ''}`,
                    })), 'index', 'asc');

                const policy = playlist.userId === user.id
                    ? AccessPolicy.DELETE :
                    playlist.sharedUsers.find((sharedUser) => sharedUser.userId === user.id)?.access ?? AccessPolicy.READ;

                return {
                    videos,
                    id: playlist.id,
                    name: playlist.name,
                    accessPolicy: policy,
                    isPublic: playlist.isPublic,
                    overview: playlist.overview,
                    author: playlist.user.username,
                    updatedAt: playlist.updated.toISOString(),
                };
            });
    }

    /**
     * @description Given a TV show, create a playlist of all episodes in the show in a shuffled order
     * @param session - The session of the user
     * @param media - The TV show to shuffle
     */
    shuffleMedia (session: CachedSession, media: Media) {
        return TaskEither
            .tryCatch(
                () => this.prisma.media.findUnique({
                    where: {
                        id: media.id,
                    },
                    include: {
                        videos: true,
                    },
                }),
                'Failed to get media',
            )
            .nonNullable('Media not found')
            .filter(
                (media) => media.videos.length > 0,
                () => createBadRequestError('Media has no videos'),
            )
            .filter(
                (media) => media.type === MediaType.SHOW,
                () => createBadRequestError('Media is not a TV show'),
            )
            .chain((media) => this.shuffleVideos(media.videos, media.name, session));
    }

    /**
     * @description Given a playlist, shuffle the videos in the playlist and create a new playlist
     * @param session - The session of the user
     * @param playlist - The playlist to shuffle
     * @param ability - The ability of the user
     */
    shufflePlaylist (session: CachedSession, playlist: Playlist, ability: AppAbilityType) {
        return TaskEither
            .tryCatch(
                () => this.prisma.playlist.findUnique({
                    where: {
                        id: playlist.id,
                    },
                    include: {
                        playlistVideos: {
                            where: accessibleBy(ability, Action.Read).PlaylistVideo,
                            include: {
                                video: {
                                    include: {
                                        media: true,
                                    },
                                },
                            },
                        },
                    },
                }),
                'Failed to get playlist',
            )
            .nonNullable('Playlist not found')
            .chain((playlist) => this.shuffleVideos(playlist.playlistVideos.map((video) => video.video), playlist.name, session));
    }

    /**
     * @description Given a PRODUCTION/DISTRIBUTION company, shuffle all the videos in the company's media and create a new playlist
     * @param session - The session of the user
     * @param companyId - The id of the company to shuffle
     * @param ability - The ability of the user
     */
    shuffleCompany (session: CachedSession, companyId: string, ability: AppAbilityType) {
        return TaskEither
            .tryCatch(
                () => this.prisma.company.findUnique({
                    where: {
                        id: companyId,
                    },
                    include: {
                        media: {
                            where: {
                                media: accessibleBy(ability, Action.Read).Media,
                            },
                            include: {
                                media: {
                                    include: {
                                        videos: true,
                                    },
                                },
                            },
                        },
                    },
                }),
                'Failed to get company media',
            )
            .nonNullable('Company not found')
            .chain((company) => {
                const videos = company.media
                    .map((media) => media.media.videos)
                    .flat();

                return this.shuffleVideos(videos, company.name, session);
            });
    }

    /**
     * @description Given a person, shuffle all the videos they have worked on and create a new playlist
     * @param session - The session of the user
     * @param ability - The ability of the user
     * @param personId - The id of the person to shuffle
     */
    shufflePerson (session: CachedSession, ability: AppAbilityType, personId: number) {
        const getVideos = (person: PersonResponse) => TaskEither
            .tryCatch(
                () => this.prisma.video.findMany({
                    where: {
                        mediaId: {
                            'in': dedupeBy([
                                ...person.directed,
                                ...person.wroteFor,
                                ...person.staredIn,
                                ...person.produced,
                            ], 'id')
                                .map((media) => media.id),
                        },
                    },
                }),
            )
            .map((videos) => ({
                videos,
                name: person.name,
            }));

        return this.mediaService.getPersonById(personId, ability)
            .chain(getVideos)
            .chain(({ videos, name }) => this.shuffleVideos(videos, name, session));
    }

    /**
   * @description Delete a playlist from the database
   * @param playlist - The playlist to delete
   */
    deletePlaylist (playlist: Playlist) {
        return TaskEither
            .tryCatch(
                () => this.prisma.playlist.delete({
                    where: {
                        id: playlist.id,
                    },
                }),
                'Failed to delete playlist',
            )
            .map(() => ({ message: 'Playlist deleted' }));
    }

    /**
   * @description Gets all the playlists a user has access to
   * @param user - The user to get playlists for
   * @param paginatedArgs - The arguments to paginate the playlists
   */
    getPlaylists (user: User, paginatedArgs: PaginateArgs) {
        return TaskEither
            .tryCatch(
                () => this.prisma.playlist.paginate({
                    where: {
                        AND: [
                            {
                                OR: [
                                    {
                                        userId: user.id,
                                    },
                                    {
                                        sharedUsers: {
                                            some: {
                                                userId: user.id,
                                            },
                                        },
                                    },
                                ],
                            },
                            {
                                generator: Generator.USER,
                            },
                        ],
                    },
                    include: {
                        playlistVideos: {
                            include: {
                                video: {
                                    include: {
                                        media: true,
                                    },
                                },
                            },
                            orderBy: {
                                index: 'asc',
                            },
                        },
                    },
                    paginate: paginatedArgs,
                    orderBy: {
                        updated: 'desc',
                    },
                }),
                'Failed to get playlists',
            )
            .map(mapPageResponse((playlist): PlaylistResponse => ({
                id: playlist.id,
                name: playlist.name,
                overview: playlist.overview,
                isPublic: playlist.isPublic,
                backdrop: playlist.playlistVideos[0]?.video.media.backdrop ?? '',
                backdropBlur: playlist.playlistVideos[0]?.video.media.backdropBlur ?? '',
                videoCount: playlist.playlistVideos.length,
                updatedAt: playlist.updated.toISOString(),
            })));
    }

    /**
   * @description Gets the count of all playlists a user has created
   * @param user - The user to get playlists count for
   */
    getPlaylistsCount (user: User) {
        return TaskEither
            .tryCatch(
                () => this.prisma.playlist.count({
                    where: {
                        userId: user.id,
                        generator: Generator.USER,
                    },
                }),
                'Failed to get playlists count',
            )
            .map((count) => count + 1)
            .map((count) => ({ count }));
    }

    /**
   * @description Gets all public playlists
   * @param user - The user to get public playlists for
   * @param paginatedArgs - The arguments to paginate the playlists
   */
    getPublicPlaylists (user: User, paginatedArgs: PaginateArgs) {
        return TaskEither
            .tryCatch(
                () => this.prisma.playlist.paginate({
                    where: {
                        isPublic: true,
                        generator: Generator.USER,
                        NOT: {
                            OR: [
                                {
                                    userId: user.id,
                                },
                                {
                                    sharedUsers: {
                                        some: {
                                            userId: user.id,
                                        },
                                    },
                                },
                            ],
                        },
                    },
                    include: {
                        playlistVideos: {
                            include: {
                                video: {
                                    include: {
                                        media: true,
                                    },
                                },
                            },
                            orderBy: {
                                index: 'asc',
                            },
                        },
                    },
                    paginate: paginatedArgs,
                }),
                'Failed to get public playlists',
            )
            .map(mapPageResponse((playlist): PlaylistResponse => ({
                id: playlist.id,
                name: playlist.name,
                overview: playlist.overview,
                isPublic: playlist.isPublic,
                backdrop: playlist.playlistVideos[0]?.video.media.backdrop ?? '',
                backdropBlur: playlist.playlistVideos[0]?.video.media.backdropBlur ?? '',
                videoCount: playlist.playlistVideos.length,
                updatedAt: playlist.updated.toISOString(),
            })));
    }

    /**
   * @description Share a playlist with other users
   * @param params - The parameters to share the playlist with
   * @param playlist - The playlist to share
   */
    sharePlaylist (params: SharePlaylistArgs, playlist: Playlist) {
        return TaskEither
            .tryCatch(
                () => this.prisma.user.findMany({
                    where: {
                        email: {
                            'in': params.users.map((user) => user.email),
                        },
                    },
                }),
                'Failed to get user',
            )
            .intersect(params.users, 'email', 'email', 'policy')
            .filter(
                (users) => users.length === params.users.length,
                () => createBadRequestError('Some users do not exist'),
            )
            .chain((users) => TaskEither
                .tryCatch(
                    () => this.prisma.sharedWith.createMany({
                        data: users.map((user) => ({
                            userId: user.id,
                            playlistId: playlist.id,
                            access: user.policy,
                        })),
                    }),
                    'Failed to share playlist',
                ))
            .map(() => ({ message: 'Playlist shared' }));
    }

    /**
   * @description Un-share a playlist with other users
   * @param params - The parameters to un-share the playlist with
   * @param playlist - The playlist to un-share
   */
    unSharePlaylist (params: SharePlaylistArgs, playlist: Playlist) {
        return TaskEither
            .tryCatch(
                () => this.prisma.user.findMany({
                    where: {
                        email: {
                            'in': params.users.map((user) => user.email),
                        },
                    },
                }),
                'Failed to get user',
            )
            .intersect(params.users, 'email', 'email', 'policy')
            .filter(
                (users) => users.length === params.users.length,
                () => createBadRequestError('Some users do not exist'),
            )
            .chain((users) => TaskEither
                .tryCatch(
                    () => this.prisma.sharedWith.deleteMany({
                        where: {
                            playlistId: playlist.id,
                            userId: {
                                'in': users.map((user) => user.id),
                            },
                        },
                    }),
                    'Failed to un-share playlist',
                ))
            .map(() => ({ message: 'Playlist unshared' }));
    }

    /**
     * @description Play a playlist video
     * @param session - The session of the user
     * @param playlistVideo - The video in the playlist to play
     */
    playPlaylistVideo (session: CachedSession, playlistVideo: PlaylistVideo) {
        return TaskEither
            .tryCatch(
                () => this.prisma.playlistVideo.findUnique({
                    where: {
                        id: playlistVideo.id,
                    },
                    include: {
                        video: {
                            include: {
                                media: true,
                                episode: true,
                                watched: {
                                    where: {
                                        userId: session.user.id,
                                    },
                                },
                            },
                        },
                        playlist: true,
                    },
                }),
                'Failed to get playlist',
            )
            .nonNullable('Playlist video not found')
            .matchTask([
                {
                    predicate: ({ playlist }) => playlist.generator === Generator.FRAMES,
                    run: (playlistVideo) => this.playbackService.getPlaybackSession(
                        {
                            video: playlistVideo.video,
                            cachedSession: session,
                            percentage: 0,
                            inform: false,
                            playlistVideo,
                        }
                    ),
                },
                {
                    predicate: ({ playlist }) => playlist.generator === Generator.USER,
                    run: (playlistVideo) => this.playbackService.getPlaybackSession(
                        {
                            inform: true,
                            playlistVideo,
                            video: playlistVideo.video,
                            cachedSession: session,
                            percentage: playlistVideo.video
                                .watched[0]?.percentage < COMPLETED_VIDEO_POSITION
                                ? playlistVideo.video.watched[0]?.percentage ?? 0 : 0,
                        }
                    ),
                },
            ]);
    }

    /**
     * @description Play the first video in a playlist
     * @param session - The session of the user
     * @param playlist - The playlist to play
     */
    playFirstPlaylistVideo (session: CachedSession, playlist: Playlist) {
        return TaskEither
            .tryCatch(
                () => this.prisma.playlistVideo.findFirst({
                    where: {
                        playlistId: playlist.id,
                        index: 0,
                    },
                }),
                'Failed to get playlist video',
            )
            .nonNullable('No videos in playlist')
            .chain((video) => this.playPlaylistVideo(session, video));
    }

    /**
     * @description Create a playlist from the given parameters and return a playback session
     * @param session - The session of the user
     * @param args - The parameters to create the playlist with
     */
    createAndGetPlaybackSession (session: CachedSession, args: CreatePlaylistArgs) {
        return TaskEither
            .tryCatch(
                () => this.prisma.playlist.create({
                    data: {
                        name: args.name,
                        userId: session.user.id,
                        overview: args.overview,
                        isPublic: args.isPublic,
                        generator: Generator.FRAMES,
                        playlistVideos: {
                            create: args.videos.map((video) => ({
                                videoId: video.videoId,
                                index: video.index,
                            })),
                        },
                    },
                    include: {
                        playlistVideos: {
                            include: {
                                video: true,
                            },
                            orderBy: {
                                index: 'asc',
                            },
                        },
                    },
                }),
                'Failed to create playlist',
            )
            .chain((playlist) => TaskEither
                .fromNullable(playlist.playlistVideos[0] ?? null)
                .chain((video) => this.playPlaylistVideo(session, video)));
    }

    /**
     * @description Get all playlists that contain the given media owned by the user
     * @param media - The media to get playlists for
     * @param user - The user to get playlists for
     * @param videoId - The video id to check if the media is in the playlist
     */
    getPlaylistsForMedia (media: Media, user: User, videoId?: string) {
        return TaskEither
            .tryCatch(
                () => this.prisma.playlist.findMany({
                    where: {
                        userId: user.id,
                        generator: Generator.USER,
                    },
                    include: {
                        _count: {
                            select: {
                                playlistVideos: {
                                    where: {
                                        video: {
                                            id: videoId,
                                            mediaId: media.id,
                                        },
                                    },
                                },
                            },
                        },
                    },
                }),
            )
            .mapItems((playlist): PlaylistForMediaContext => ({
                playlistId: playlist.id,
                playlistName: playlist.name,
                isPublic: playlist.isPublic,
                mediaInPlaylist: playlist._count.playlistVideos > 0,
            }));
    }

    /**
     * @description Add a media to a playlist
     * @param user - The user adding the media
     * @param media - The media to add
     * @param playlist - The playlist to add the media to
     * @param ability - The ability of the user
     */
    addMediaToPlaylist (user: User, media: Media, playlist: Playlist, ability: AppAbilityType) {
        const getVideos = (playlistVideos: PlaylistVideo[]) => TaskEither
            .tryCatch(
                () => this.prisma.video.findMany({
                    where: {
                        mediaId: media.id,
                    },
                    include: {
                        episode: true,
                    },
                }),
            )
            .map((videos) => {
                const mappedVideos = sortBy(
                    videos.map((video) => ({
                        id: video.id,
                        videoId: video.id,
                        season: video.episode?.season ?? 0,
                        episode: video.episode?.episode ?? 0,
                    })),
                    ['season', 'episode'],
                    ['asc', 'asc'],
                );

                const newVideos = playlistVideos.map((video) => ({
                    id: video.id,
                    index: video.index,
                    videoId: video.videoId,
                }))
                    .concat(mappedVideos.map((video, index) => ({
                        id: '',
                        index: index + playlistVideos.length,
                        videoId: video.id,
                    })));

                return this.createPlaylistArgs(playlist, newVideos);
            });

        return TaskEither
            .tryCatch(
                () => this.prisma.playlistVideo.findMany({
                    where: {
                        playlistId: playlist.id,
                    },
                }),
            )
            .chain(getVideos)
            .chain((args) => this.updatePlaylist(user, playlist, args, ability));
    }

    /**
     * @description Delete a media from a playlist
     * @param user - The user deleting the media
     * @param media - The media to delete
     * @param playlist - The playlist to delete the media from
     * @param ability - The ability of the user
     */
    removeMediaFromPlaylist (user: User, media: Media, playlist: Playlist, ability: AppAbilityType) {
        const deleteVideos = TaskEither
            .tryCatch(
                () => this.prisma.playlistVideo.deleteMany({
                    where: {
                        playlistId: playlist.id,
                        video: {
                            mediaId: media.id,
                        },
                    },
                }),
            );

        const getVideos = () => TaskEither
            .tryCatch(
                () => this.prisma.playlistVideo.findMany({
                    where: {
                        playlistId: playlist.id,
                    },
                }),
            )
            .map((videos) => {
                const newVideos = sortBy(videos, 'index', 'asc')
                    .map((video, index) => ({
                        id: video.id,
                        index,
                        videoId: video.videoId,
                    }));

                return this.createPlaylistArgs(playlist, newVideos);
            });

        return deleteVideos
            .chain(getVideos)
            .chain((args) => this.updatePlaylist(user, playlist, args, ability));
    }

    private shuffleVideos (videos: Video[], name: string, session: CachedSession) {
        const shuffledVideos = shuffle(videos)
            .map((video, index) => ({
                index,
                videoId: video.id,
            }));

        const createArgs: CreatePlaylistArgs = {
            name: `Shuffled Playlist - ${name}`,
            overview: `Shuffled Playlist for ${name}`,
            isPublic: false,
            videos: shuffledVideos,
        };

        const deleteCurrentExistingPlaylist = TaskEither
            .tryCatch(
                () => this.prisma.playlist.deleteMany({
                    where: {
                        AND: [
                            {
                                name: createArgs.name,
                            },
                            {
                                userId: session.user.id,
                            },
                        ],
                    },
                }),
                'Failed to delete existing playlist',
            );

        return deleteCurrentExistingPlaylist
            .chain(() => this.createAndGetPlaybackSession(session, createArgs));
    }

    private createPlaylistArgs (playlist: Playlist, videos: VideoItem[]) {
        const args = new UpdatePlaylistArgs();

        args.videos = videos;
        args.id = playlist.id;
        args.name = playlist.name;
        args.overview = playlist.overview;
        args.isPublic = playlist.isPublic;

        return args;
    }
}
