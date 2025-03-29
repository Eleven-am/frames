import { createQueries, createActions } from '@/queries/base';

export const authQueries = createQueries('auth', {
    oauthClients: {
        queryFn: (api) => api.oauthControllerFindAll({
            page: 1,
            pageSize: 10,
        }),
    },
});

export const authActions = createActions('auth', {
    webAuthnStatus: {
        initialData: false,
        queryFn: (api) => api.authControllerIsWebAuthnEnabled(),
        mutationFn: (api, activated: boolean) => api.authControllerEnableWebAuthn({
            activated,
        }),
    },
});
