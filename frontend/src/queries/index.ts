import { PickType } from '@/api/data-contracts';
import { createQueries, createInfiniteQueries } from '@/queries/base';

export enum HomeRecommendationTypes {
    BASIC = 'BASIC',
    EDITOR = 'EDITOR',
    RECOMMEND = 'RECOMMEND',
}

export const indexQueries = createQueries('index', {
    continueWatching: {
        queryFn: (api) => api.usersControllerGetContinueWatching(),
    },
    whatOthersAreWatching: {
        queryFn: (api) => api.mediaControllerGetTrendingHomeScreen(),
    },
    topRated: {
        queryFn: (api) => api.mediaControllerGetTopRatedHomeScreen(),
    },
    popular: {
        queryFn: (api) => api.mediaControllerGetPopularHomeScreen(),
    },
    airingToday: {
        queryFn: (api) => api.mediaControllerGetAiringTodayHomeScreen(),
    },
    nowPlaying: {
        queryFn: (api) => api.mediaControllerGetNowPlayingHomeScreen(),
    },
    rated: {
        queryFn: (api) => api.ratingControllerFindAll(),
    },
    recommended: {
        queryFn: (api) => api.usersControllerGetRecommendations(),
    },
    recentlyAdded: {
        queryFn: (api) => api.mediaControllerGetRecentlyAddedHomeScreen(),
    },
    trending: {
        queryFn: (api) => api.mediaControllerGetTrendingBanner(),
    },
    picksCount: {
        queryFn: (api) => api.picksControllerGetPicksCount(),
    },
    trendingCarousel: {
        initialData: [],
        queryFn: (api) => api.mediaControllerGetTrending(),
    },
    pickItem: (type: HomeRecommendationTypes, count: number) => ({
        queryKey: [type, count],
        queryFn: (api) => type === HomeRecommendationTypes.RECOMMEND ?
            api.mediaControllerGetRecommendedHomeScreen() :
            api.picksControllerGetPicksByIndex({
                type: type === HomeRecommendationTypes.BASIC ? PickType.BASIC : PickType.EDITOR,
                index: count,
            }),
    }),
    fuzzySearch: (query: string) => ({
        initialData: [],
        queryKey: [query],
        enabled: Boolean(query),
        queryFn: (api) => api.mediaControllerFuzzySearch({
            query,
        }),
    }),
});

export const indexInfiniteQueries = createInfiniteQueries('indexInfinite', {
    search: (query: string) => ({
        queryKey: [query],
        enabled: Boolean(query),
        queryFn: (api, page) => api.mediaControllerSearchMedia({
            pageSize: 25,
            query,
            page,
        }),
    }),
});
