import { OauthClientSchema, Role } from '@/api/data-contracts';
import { createMutations, createQueries } from '@/queries/base';

export const accessQueries = createQueries('access', {
    getAuthKeys: {
        queryFn: (api) => api.authKeyControllerGetAuthKeys({
            page: 1,
            pageSize: 10 * 1000,
        }),
    },
    getOauthClients: {
        queryFn: (api) => api.oauthControllerFindAll({
            page: 1,
            pageSize: 10 * 1000,
        }),
    },
    getUsers: {
        queryFn: (api) => api.usersControllerGetUsers({
            page: 1,
            pageSize: 10 * 1000,
        }),
    },
    getOauthClientById: (id?: string) => ({
        enabled: Boolean(id),
        queryFn: (api) => api.oauthControllerFindOne(id || ''),
    }),
});

export const accessMutations = createMutations({
    createAuthKey: {
        invalidateKeys: [accessQueries.getAuthKeys.queryKey],
        mutationFn: (api) => api.authKeyControllerCreateAuthKey(),
    },
    createOauthClient: {
        invalidateKeys: [accessQueries.getOauthClients.queryKey],
        mutationFn: (api, args) => api.oauthControllerCreateOauth(args),
    },
    updateOauthClient: {
        invalidateKeys: [accessQueries.getOauthClients.queryKey],
        mutationFn: (api, args: OauthClientSchema) => api.oauthControllerUpdateOauth(args.id, args),
    },
    deleteOauthClient: (closeModal: () => void) => ({
        invalidateKeys: [accessQueries.getOauthClients.queryKey],
        mutationFn: (api, id: string) => api.oauthControllerDeleteOauth(id),
        onSuccess: closeModal,
    }),
    promoteUsers: {
        invalidateKeys: [accessQueries.getUsers.queryKey],
        mutationFn: (api, { userIds, role }: { userIds: string[], role: Role }) => api.usersControllerPromoteUsers({
            userIds,
            role,
        }),
    },
    revokeUsers: {
        invalidateKeys: [accessQueries.getUsers.queryKey],
        mutationFn: (api, userIds: string[]) => api.usersControllerRevokeUsersAccess({
            userIds,
        }),
    },
    confirmUsers: {
        invalidateKeys: [accessQueries.getUsers.queryKey],
        mutationFn: (api, userIds: string[]) => api.usersControllerConfirmUsers({
            userIds,
        }),
    },
    grantUsersAccess: {
        invalidateKeys: [accessQueries.getUsers.queryKey],
        mutationFn: (api, userIds: string[]) => api.usersControllerGrantUsersAccess({
            userIds,
        }),
    },
    deleteUsers: {
        invalidateKeys: [accessQueries.getUsers.queryKey],
        mutationFn: (api, userIds: string[]) => api.usersControllerDeleteUsers({
            userIds,
        }),
    },
});
