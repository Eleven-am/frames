import { HistoryType, RatedStatus } from '@/api/data-contracts';
import { createMutations, createInfiniteQueries } from '@/queries/base';

export const activityInfiniteQueries = createInfiniteQueries('activity', {
    get: (query: string, types: HistoryType[], key: string) => ({
        queryKey: [query, key, ...types],
        queryFn: (api, page) => api.usersControllerGetActivity({
            page,
            type: types,
            pageSize: 25,
            query: query || undefined,
        }),
    }),
});

export const activityMutations = createMutations({
    rateMedia: (mediaId: string, onSettled: () => void) => ({
        onSettled,
        mutationFn: (api, status: RatedStatus) => {
            if (status === RatedStatus.NONE) {
                return api.ratingControllerRemove(mediaId);
            } else if (status === RatedStatus.POSITIVE) {
                return api.ratingControllerRatePositive(mediaId);
            }

            return api.ratingControllerRateNegative(mediaId);
        },
    }),
    watchList: (mediaId: string, onSettled: () => void) => ({
        onSettled,
        mutationFn: (api, addToList: boolean) => addToList
            ? api.listsControllerAddToList(mediaId)
            : api.listsControllerRemoveFromList(mediaId),
    }),
    seenMedia: (mediaId: string, onSettled: () => void) => ({
        onSettled,
        mutationFn: (api, seen: boolean) => seen
            ? api.seenControllerCreate(mediaId)
            : api.seenControllerRemove(mediaId),
    }),
    seenVideo: (videoId: string | undefined, onSettled: () => void) => ({
        onSettled,
        mutationFn: (api, seen: boolean) => seen
            ? api.playbackControllerAddVideo(videoId || '')
            : api.playbackControllerDeleteVideo(videoId || ''),
    }),
    deleteHistories: (historyIds: string[], onSettled: () => void) => ({
        onSettled,
        mutationFn: (api) => api.usersControllerDeleteItems({
            itemIds: historyIds,
        }),
    }),
});
