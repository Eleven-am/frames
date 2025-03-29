import { Api } from '@/api/Api';
import {
    CreatePlaylistArgs,
    HttpExceptionSchema,
    PageResponsePlaylistSchema,
    PlaylistDetailsSchema,
} from '@/api/data-contracts';
import { HttpResponse } from '@/api/http-client';
import { navigate } from '@/hooks/useClientAction';
import { createActions, createInfiniteQueries, createMutations, createQueries } from '@/queries/base';
import { hasData } from '@eleven-am/fp';

interface MutateAction {
    playlistId: string;
    action: 'Add' | 'Remove' | 'Create';
    name: string | null;
}

interface PerformActionOnPlaylistOptions {
    action: 'Add' | 'Remove' | 'Create';
    playlistId: string | null;
    videoId: string | null;
    name: string | null;
    mediaId: string;
}

async function performActionOnPlaylist (client: Api<never>, {
    action,
    videoId,
    name,
    playlistId,
    mediaId,
}: PerformActionOnPlaylistOptions) {
    if (action === 'Create' && name) {
        const state: CreatePlaylistArgs = {
            name,
            videos: [],
            overview: '',
            isPublic: false,
        };

        if (videoId) {
            state.videos.push({
                videoId,
                index: 0,
            });
        }

        const response = await client.playlistsControllerCreatePlaylist(state);

        if (videoId) {
            return response;
        }

        return client.playlistsControllerAddMediaToPlaylist(response.data.id, mediaId);
    }

    if (playlistId) {
        if (action === 'Add') {
            return client.playlistsControllerAddMediaToPlaylist(playlistId, mediaId);
        }

        if (action === 'Remove') {
            return client.playlistsControllerRemoveMediaFromPlaylist(playlistId, mediaId);
        }
    }

    throw new Error('Invalid action');
}

export async function createPlaylistAndRedirect (api: Api<never>, playlist: PlaylistDetailsSchema): Promise<HttpResponse<PlaylistDetailsSchema, HttpExceptionSchema>> {
    const response = await api.playlistsControllerCreatePlaylist(playlist);

    if (hasData(response)) {
        await navigate({
            to: '/playlist/$playlistId',
            params: {
                playlistId: response.data.id,
            },
        });
    }

    return response;
}

export function updatePlaylist (api: Api<never>, playlist: PlaylistDetailsSchema) {
    return api.playlistsControllerUpdatePlaylist(playlist.id, playlist);
}

export const playlistActions = createActions('playlist', {
    addPlaylist: (mediaId: string, videoId: string | null) => ({
        initialData: [],
        enabled: Boolean(mediaId),
        queryFn: (api) => api.playlistsControllerGetPlaylistsForMedia(mediaId, {
            videoId: videoId || undefined,
        }),
        mutationFn: (api, { playlistId, action, name }: MutateAction) => performActionOnPlaylist(api, {
            action,
            mediaId,
            name,
            playlistId,
            videoId,
        }),
    }),
});

export const playlistQueries = createQueries('playlist', {
    getPublicPlaylists: {
        queryFn: (api) => api.playlistsControllerGetPublicPlaylists({
            page: 1,
            pageSize: 25,
        }),
    },
    getPlaylists: {
        queryFn: (api) => api.playlistsControllerGetPlaylists({
            page: 1,
            pageSize: 25,
        }),
    },
    playlistCount: {
        queryFn: (api) => api.playlistsControllerGetPlaylistsCount(),
    },
    getPlaylist: (playlistId: string) => ({
        queryKey: [playlistId],
        queryFn: (api) => api.playlistsControllerGetPlaylist(playlistId),
    }),
});

export const playlistInfiniteQueries = createInfiniteQueries('playlist', {
    privatePlaylists: (items: PageResponsePlaylistSchema) => ({
        initialData: items,
        queryFn: (api, page) => api.playlistsControllerGetPlaylists({
            page,
            pageSize: 25,
        }),
    }),
    publicPlaylists: (items: PageResponsePlaylistSchema) => ({
        initialData: items,
        queryFn: (api, page) => api.playlistsControllerGetPublicPlaylists({
            page,
            pageSize: 25,
        }),
    }),
    searchPlaylists: (query: string) => ({
        queryKey: [query],
        enabled: Boolean(query),
        queryFn: (api, page) => api.mediaControllerSearchMediaWithVideos({
            query,
            page,
            pageSize: 25,
        }),
    }),
});

export const playlistMutations = createMutations({
    deletePlaylist: {
        mutationFn: (api, playlistId: string) => api.playlistsControllerDeletePlaylist(playlistId),
    },
});
