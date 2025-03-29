import { MediaType, CreateMediaArgs, CreateFromTmdbIdArgs, DeleteFileArgs } from '@/api/data-contracts';
import { notify } from '@/components/toast';
import { createMutations, createInfiniteQueries, createQueries } from '@/queries/base';

export const libraryInfiniteQueries = createInfiniteQueries('libraries', {
    listAll: (query: string) => ({
        queryKey: [query],
        queryFn: (api, page) => api.scannerControllerGetUnScannedItems({
            page,
            search: query,
            pageSize: 25,
        }),
    }),
});

export const libraryQueries = createQueries('libraries', {
    listStorages: {
        initialData: [],
        queryFn: (api) => api.scannerControllerGetStorages(),
    }
})

export const libraryMutations = createMutations({
    scanLibrary: (storageId: string) => ({
        mutationFn: (api, type: MediaType) => type === MediaType.MOVIE ?
            api.scannerControllerScanMovies(storageId) :
            api.scannerControllerScanShows(storageId),
    }),
    scanStorage: (storageId: string) => ({
        mutationFn: (api) => api.scannerControllerScanStorage(storageId),
        onSuccess: () => notify({
            browserId: 'scan-started',
            title: 'Library scan started',
            content: 'The library scan has been started',
        }),
    }),
    scanEpisodesInShow: (name: string) => ({
        mutationFn: (api, showId: string) => api.scannerControllerScanEpisodesInShow(showId),
        onSuccess: () => notify({
            title: 'Episodes Scanned',
            content: `Episodes for ${name} have been scanned`,
            browserId: 'episodes-scanned',
        }),
    }),
    deleteMedia: {
        mutationFn: (api, mediaId: string) => api.scannerControllerDeleteMedia(mediaId),
    },
    getTmdbId: (type: MediaType) => ({
        mutationFn: (api, tmdbId: string) => api.scannerControllerGetMediaFromTmdbId({
            tmdbId: Number(tmdbId),
            type,
        }),
    }),
    createNewMedia: (storageId: string, onSaved: () => void) => ({
        mutationFn: (api, media: CreateMediaArgs) => api.scannerControllerCreateMedia(storageId, media),
        onSuccess: onSaved,
    }),
    createFromTmdbId: (storageId: string, onSaved: () => void, onError: (lisLoading: boolean) => void) => ({
        mutationFn: (api, media: CreateFromTmdbIdArgs) => api.scannerControllerCreateFromTmdbId(storageId, media),
        onSuccess: onSaved,
        onError: () => onError(false),
    }),
    deleteFile: {
        mutationFn: (api, { storageId, filepath }: DeleteFileArgs) => api.storageControllerRemoveFile(storageId, {
            filepath,
            storageId,
        }),
    },
});
