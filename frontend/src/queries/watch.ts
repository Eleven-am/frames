import { Api } from '@/api/Api';
import { notify } from '@/components/toast';
import { userStore } from '@/providers/userProvider';
import { createQueries, createMutations } from '@/queries/base';
import { getSnapshot } from '@eleven-am/notifier';
import { notFound } from '@tanstack/react-router';
import { z } from 'zod';

interface UpdateOffsetOptions {
    offset: number;
    subtitleId: string;
}

export const watchSearchSchema = z.object({
    mediaId: z.string().optional(),
    episodeId: z.string().optional(),
    playlistId: z.string().optional(),
    playlistVideoId: z.string().optional(),
    playbackId: z.string().optional(),
    videoId: z.string().optional(),
    shuffle: z.boolean().optional(),
    reset: z.boolean().optional(),
    frame: z.string().optional(),
    myList: z.boolean().optional(),
    personId: z.string().optional(),
    companyId: z.string().optional(),
});

export type WatchSearch = z.infer<typeof watchSearchSchema>;

export async function getSession (client: Api<never>, search: WatchSearch) {
    const {
        mediaId,
        shuffle,
        episodeId,
        playlistId,
        playlistVideoId,
        playbackId,
        videoId,
        reset,
        frame,
        personId,
        companyId,
    } = search;

    if (mediaId) {
        return shuffle ? client.playlistsControllerShuffleMedia(mediaId) : client.mediaControllerPlayMediaById(mediaId);
    } else if (playlistId) {
        return shuffle ? client.playlistsControllerShufflePlaylist(playlistId) : client.playlistsControllerPlayPlaylist(playlistId);
    } else if (episodeId) {
        return client.mediaControllerPlayMediaEpisodeById(episodeId, {
            reset: reset || false,
        });
    } else if (playlistVideoId) {
        return client.playlistsControllerPlayPlaylistVideo(playlistVideoId);
    } else if (videoId) {
        return client.playbackControllerStartPlayback(videoId);
    } else if (playbackId) {
        return client.playbackControllerCreateNewSession(playbackId);
    } else if (frame) {
        if (!getSnapshot(userStore).session) {
            await userStore.continueAsGuest();
        }

        return client.framesControllerGetFrame(frame);
    } else if (search.myList) {
        return client.listsControllerPlayMyList();
    } else if (personId) {
        return client.playlistsControllerShufflePerson(personId);
    } else if (companyId) {
        return client.playlistsControllerShuffleCompany(companyId);
    }

    throw notFound();
}

export const watchQueries = createQueries('watch', {
    thumbnails: (playbackId: string, canAccessStream: boolean, reFetch) => ({
        initialData: [],
        queryKey: [playbackId, canAccessStream],
        enabled: Boolean(playbackId) && canAccessStream,
        refetchIntervalInBackground: reFetch,
        refetchInterval: reFetch ? 1000 * 30 : false,
        queryFn: (api) => api.streamControllerGetThumbnails(playbackId),
    }),
    upNext: (playbackId: string) => ({
        queryKey: [playbackId],
        enabled: Boolean(playbackId),
        queryFn: (api) => api.playbackControllerGetUpNext(playbackId),
    }),
    cues: (subtitleId: string | undefined, canAccessStream: boolean) => ({
        queryKey: [subtitleId, canAccessStream],
        enabled: Boolean(subtitleId) && canAccessStream,
        queryFn: (api) => api.subtitlesControllerGetSubtitles(subtitleId ?? ''),
    }),
    roomData: (roomId: string) => ({
        queryKey: [roomId],
        enabled: Boolean(roomId),
        queryFn: (api) => api.roomsControllerJoinRoom(roomId),
    }),
    getSession: (search: WatchSearch) => ({
        queryKey: [search],
        enabled: Boolean(search),
        queryFn: (api) => getSession(api, search),
    }),
});

export const watchMutations = createMutations({
    saveProgress: (playbackId: string) => ({
        toastError: false,
        mutationFn: (api, percentage: number) => api.playbackControllerSaveInformation(playbackId, {
            percentage,
        }),
    }),
    updateOffset: {
        mutationFn: (api, { offset, subtitleId }: UpdateOffsetOptions) => api.subtitlesControllerUpdateOffset(subtitleId, {
            offset,
        }),
    },
    downloadVideo: (playbackId: string, toggleDownload: () => void) => ({
        mutationFn: (api, authKey: string) => api.downloadsControllerCreate(authKey, playbackId),
        onSuccess: (data) => {
            window.location.href = `/api/downloads/${data.location}`;

            notify({
                title: 'Download started',
                content: 'Your download has started',
                browserId: 'download',
                success: true,
            });

            toggleDownload();
        },
    }),
    shareVideo: (playbackId: string, cypher: string) => ({
        mutationFn: (api, percentage: number) => api.framesControllerCreateFrame(playbackId, {
            percentage,
            cypher,
        })
    }),
});
