import { PickType, PickResponseSchema } from '@/api/data-contracts';
import { createInfiniteQueries, createActions, createMutations } from '@/queries/base';

export const picksInfiniteQueries = createInfiniteQueries('picks', {
    get: (type: PickType) => ({
        queryKey: [type],
        queryFn: (api, page) => api.picksControllerGetPicks({
            page,
            type: type,
            pageSize: 25,
        }),
    }),
});

export const picksActions = createActions('picks', {
    modal: (initialData: PickResponseSchema) => ({
        toastError: false,
        initialData: initialData,
        queryKey: [initialData.id],
        queryFn: (api, variables?: PickResponseSchema) => api.picksControllerGetPickCategory(variables?.id ?? initialData.id),
        mutationFn: (api, variables: PickResponseSchema) => variables.id === '' ?
            api.picksControllerCreatePickCategory({
                ...variables,
                media: variables.media.map((m) => ({
                    id: m.media.id,
                    index: m.index,
                })),
            }) :
            api.picksControllerUpdatePickCategory(variables.id, {
                ...variables,
                media: variables.media.map((m) => ({
                    id: m.media.id,
                    index: m.index,
                })),
            }),
    }),
});

export const picksMutations = createMutations({
    deletePicks: (pickCategories: string[], onSettled: () => void) => ({
        onSettled,
        mutationFn: (api) => api.picksControllerDeletePicks({
            ids: pickCategories,
        }),
    }),
});
