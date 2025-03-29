import { IsInListResponseSchema } from '@/api/data-contracts';
import { createActions, createQueries } from '@/queries/base';

export const listQueries = createQueries('myList', {
    myList: {
        queryFn: (api) => api.listsControllerGetLists(),
    },
    myListPage: {
        staleTime: 0,
        refetchOnMount: 'always',
        queryFn: (api) => api.listsControllerGetListsPage(),
    },
});

export const listActions = createActions('myList', {
    addToList: (mediaId: string, data: IsInListResponseSchema) => ({
        initialData: data,
        queryKey: [mediaId],
        invalidateKeys: [listQueries.all.queryKey],
        queryFn: (api) => api.listsControllerCheckList(mediaId),
        mutationFn: (api, addToList: boolean) => {
            if (!addToList) {
                return api.listsControllerRemoveFromList(mediaId);
            }

            return api.listsControllerAddToList(mediaId);
        },
    }),
});
