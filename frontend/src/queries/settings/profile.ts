import { createQueries, createMutations } from '@/queries/base';

export const profileQueries = createQueries('profile', {
    details: {
        queryFn: (api) => api.usersControllerGetProfileDetails(),
    },
    downloads: {
        initialData: [],
        queryFn: (api) => api.downloadsControllerGetAll(),
    },
});

export const profileMutations = createMutations({
    username: {
        invalidateKeys: [profileQueries.details.queryKey],
        mutationFn: (api, username: string) => api.usersControllerUpdateUsername({
            username,
        }),
    },
});
