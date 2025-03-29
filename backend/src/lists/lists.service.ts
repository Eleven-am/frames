import { accessibleBy } from '@casl/prisma';
import { AppAbilityType, Action } from '@eleven-am/authorizer';
import { TaskEither, shuffle } from '@eleven-am/fp';
import { Injectable } from '@nestjs/common';
import { Media, User, Video } from '@prisma/client';

import { PlayMyListArgs } from './lists.contracts';
import { LanguageReturn } from '../language/language.types';
import { MediaService } from '../media/media.service';
import { RecommendationsService } from '../media/recommendations.service';
import { CreatePlaylistArgs, SingleVideo } from '../playlists/playlists.contracts';
import { PlaylistsService } from '../playlists/playlists.service';
import { PrismaService } from '../prisma/prisma.service';
import { CachedSession } from '../session/session.contracts';


@Injectable()
export class ListsService {
    constructor (
        private readonly prisma: PrismaService,
        private readonly mediaService: MediaService,
        private readonly playlistService: PlaylistsService,
        private readonly recommendationsService: RecommendationsService,
    ) {}

    /**
     * @description Returns the lists of media items a user has added
     * @param ability - The user's ability
     */
    getListsForHome (ability: AppAbilityType) {
        return this.getLists(ability)
            .map(this.recommendationsService.buildBasicHomeResponse('your list', 'my-list'));
    }

    /**
   * @description Adds a media item to a user's list
   * @param user - The user to add the media item to
   * @param media - The media item to add
   */
    addToList (user: User, media: Media) {
        return TaskEither
            .tryCatch(
                () => this.prisma.listItem.create({
                    data: {
                        user: {
                            connect: {
                                id: user.id,
                            },
                        },
                        media: {
                            connect: {
                                id: media.id,
                            },
                        },
                    },
                }),
                'Error adding to list',
            )
            .map(() => ({ isInList: true }));
    }

    /**
   * @description Removes a media item from a user's list
   * @param user - The user to remove the media item from
   * @param media - The media item to remove
   */
    removeFromList (user: User, media: Media) {
        return TaskEither.tryCatch(
            () => this.prisma.listItem.delete({
                where: {
                    listIndex: {
                        userId: user.id,
                        mediaId: media.id,
                    },
                },
            }),
            'Error removing from list',
        ).map(() => ({ isInList: false }));
    }

    /**
   * @description Checks if a media item is in a user's list
   * @param user - The user to check
   * @param media - The media item to check
   */
    checkList (user: User, media: Media) {
        return TaskEither
            .tryCatch(
                () => this.prisma.listItem.findUnique({
                    where: {
                        listIndex: {
                            userId: user.id,
                            mediaId: media.id,
                        },
                    },
                }),
                'Error checking if item is in list',
            )
            .map((item) => ({ isInList: Boolean(item) }));
    }

    /**
     * @description Returns the lists of media items a user has added, with more details
     * @param ability - The user's ability
     * @param language - The language to get the media details in
     */
    getListsPage (ability: AppAbilityType, language: LanguageReturn) {
        return this.getLists(ability)
            .chainArray((lists) => lists.map(this.mediaService.getMediaDetails(language)));
    }

    /**
     * @description Plays the user's list
     * @param session - The user's session
     * @param ability - The user's ability
     * @param playArgs - The arguments for playing the list
     */
    playMyList (session: CachedSession, ability: AppAbilityType, playArgs: PlayMyListArgs) {
        return TaskEither
            .tryCatch(
                () => this.prisma.listItem.findMany({
                    where: {
                        AND: [
                            {
                                NOT: {
                                    media: {
                                        seenMedia: {
                                            some: {
                                                userId: session.user.id,
                                            },
                                        },
                                    },
                                },
                            },
                            accessibleBy(ability, Action.Read).ListItem,
                        ],
                    },
                    include: {
                        media: {
                            include: {
                                videos: true,
                                episodes: {
                                    include: {
                                        video: true,
                                    },
                                    orderBy: {
                                        season: 'asc',
                                        episode: 'asc',
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { created: 'desc' },
                }),
                'Error getting lists',
            )
            .mapItems((item) => item.media)
            .mapItems((media): Video[] => {
                if (media.episodes.length) {
                    return media.episodes.map((episode) => episode.video);
                }

                return media.videos;
            })
            .map((videos) => videos.flat())
            .map((videos): CreatePlaylistArgs => {
                const name = `My List - ${session.user.username}${playArgs.shuffle ? ' (Shuffled)' : ''}`;
                const overview = `All the videos you in your list on ${new Date().toLocaleDateString()}`;
                const innerVideos = playArgs.shuffle ? shuffle(videos) : videos;
                const newVideos: SingleVideo[] = innerVideos.map((video, index) => ({
                    videoId: video.id,
                    index,
                }));

                return {
                    name,
                    overview,
                    videos: newVideos,
                    isPublic: false,
                };
            })
            .chain((args) => this.playlistService.createAndGetPlaybackSession(session, args));
    }

    private getLists (ability: AppAbilityType) {
        return TaskEither
            .tryCatch(
                () => this.prisma.listItem.findMany({
                    include: { media: true },
                    orderBy: { created: 'desc' },
                    where: accessibleBy(ability, Action.Read).ListItem,
                }),
                'Error getting lists',
            )
            .map((list) => list.map((item) => item.media))
            .map((list) => list.map((item) => this.recommendationsService.toSlimMedia(item)));
    }
}
