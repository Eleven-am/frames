import { QueryClient } from '@tanstack/react-query';

import { Api } from '@/api/Api';
import { GetMediaSchema,
    HttpExceptionSchema,
    MediaType,
    PageResponseSlimMediaSchema,
    PlaylistDetailsSchema,
    RatedStatus,
    RatingResponseSchema,
    SeenResponseSchema } from '@/api/data-contracts';
import { HttpResponse } from '@/api/http-client';
import { IRouterContext } from '@/hooks/useClientAction';
import { createActions, createInfiniteQueries, createQueries } from '@/queries/base';
import { indexQueries } from '@/queries/index';
import { playlistActions } from '@/queries/playlist';

interface EditPlaylistOptions {
    playlist: PlaylistDetailsSchema;
    action: (api: Api<never>, data: PlaylistDetailsSchema) => Promise<HttpResponse<PlaylistDetailsSchema, HttpExceptionSchema>>;
}

export const mediaQueries = createQueries('media', {
    details: (mediaId: string) => ({
        queryKey: [mediaId],
        queryFn: (api) => api.mediaControllerGetMediaById(mediaId),
    }),
    user: (mediaId: string) => ({
        queryKey: [mediaId],
        initialData: {
            isInList: false,
            canModify: false,
            rating: RatedStatus.NONE,
            seen: {
                hasSeen: false,
                videosSeen: [],
            },
        },
        queryFn: (api) => api.usersControllerGetMediaDetails(mediaId),
    }),
    episodes: (mediaId: string, type: MediaType) => ({
        queryKey: [mediaId],
        initialData: [],
        enabled: type === MediaType.SHOW,
        queryFn: (api) => api.scannerControllerGetMediaEpisodes(mediaId),
    }),
    images: (tmdbId: number, type: MediaType) => ({
        queryKey: [tmdbId, type],
        enabled: tmdbId > 0,
        initialData: {
            backdrops: [],
            posters: [],
            logos: [],
            portraits: [],
        },
        queryFn: (api) => api.scannerControllerGetMediaImages({
            tmdbId,
            type,
        }),
    }),
    genres: (genres: string[], selectedGenres: string[], decade: number, type: MediaType) => ({
        queryKey: [type, decade, selectedGenres],
        initialData: genres,
        queryFn: (api) => api.mediaControllerFilterGenres({
            type,
            decade,
            genres: selectedGenres,
        }),
    }),
    filter: (type: MediaType, decade: number, genres: string[]) => ({
        queryKey: [type, decade, genres],
        queryFn: (api) => api.mediaControllerFilterMedia({
            type,
            decade,
            genres,
            page: 1,
            pageSize: 25,
        }),
    }),
    decades: (type: MediaType) => ({
        queryKey: [type],
        queryFn: (api) => api.mediaControllerGetDecades({
            type,
        }),
    }),
    banners: (type: MediaType) => ({
        queryKey: [type],
        queryFn: (api) => api.mediaControllerGetTrendingMediaByType(type),
    }),
});

export const mediaActions = createActions('media', {
    markAsWatched: (mediaId: string, data: SeenResponseSchema) => ({
        initialData: data,
        queryKey: [mediaId],
        invalidateKeys: [
            indexQueries.continueWatching.queryKey,
            mediaQueries.user(mediaId).queryKey,
        ],
        queryFn: (api) => api.seenControllerFindOne(mediaId),
        mutationFn: (api, hasSeen: boolean) => {
            if (hasSeen) {
                return api.seenControllerCreate(mediaId);
            }

            return api.seenControllerRemove(mediaId);
        },
    }),
    rateMedia: (mediaId: string, data: RatingResponseSchema) => ({
        initialData: data,
        queryKey: [mediaId],
        queryFn: (api) => api.ratingControllerFindOne(mediaId),
        mutationFn: (api, status: RatedStatus) => {
            if (status === RatedStatus.NONE) {
                return api.ratingControllerRemove(mediaId);
            } else if (status === RatedStatus.POSITIVE) {
                return api.ratingControllerRatePositive(mediaId);
            }

            return api.ratingControllerRateNegative(mediaId);
        },
    }),
    editMedia: (mediaId: string, media: GetMediaSchema) => ({
        initialData: media,
        queryKey: ['edit', mediaId],
        invalidateKeys: [mediaQueries.details(mediaId).queryKey],
        queryFn: (api) => api.scannerControllerGetMediaForEdit(mediaId),
        mutationFn: (api, media: GetMediaSchema) => api.scannerControllerUpdateMedia(mediaId, media),
    }),
    editPlaylist: ({ playlist, action }: EditPlaylistOptions) => ({
        initialData: playlist,
        queryKey: [playlist.id],
        invalidateKeys: [playlistActions.all.queryKey],
        queryFn: (api) => api.playlistsControllerGetPlaylist(playlist.id),
        mutationFn: (api, newPlaylist: PlaylistDetailsSchema) => action(api, newPlaylist),
    }),
});

export const mediaInfiniteQueries = createInfiniteQueries('media', {
    filter: (type: MediaType, decade: number, genres: string[], initialData: PageResponseSlimMediaSchema) => ({
        initialData,
        queryKey: [type, decade, ...genres.sort()],
        queryFn: (api, page) => api.mediaControllerFilterMedia({
            type,
            decade,
            genres,
            page,
            pageSize: 25,
        }),
    }),
});

export async function fetchMediaGridPageQuery (queryClient: QueryClient, type: MediaType) {
    const genres = await queryClient.ensureQueryData(mediaQueries.genres([], [], 0, type));
    const decades = await queryClient.ensureQueryData(mediaQueries.decades(type));
    const banners = await queryClient.ensureQueryData(mediaQueries.banners(type));

    await queryClient.ensureQueryData(mediaQueries.filter(type, 0, []));

    return {
        banners: banners.slice(0, 7),
        decades,
        genres,
    };
}

export async function getMediaData (mediaId: string, { queryClient }: IRouterContext) {
    await queryClient.ensureQueryData(mediaQueries.user(mediaId));
    await queryClient.ensureQueryData(mediaQueries.details(mediaId));

    return {
        mediaId,
    };
}
