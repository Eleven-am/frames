import { Api } from '@/api/Api';
import { HttpExceptionSchema } from '@/api/data-contracts';
import { HttpResponse } from '@/api/http-client';
import { getClient } from '@/hooks/useClientAction';
import { mapResponse } from '@/providers/apiProvider';
import { hasData } from '@eleven-am/fp';
import { queryFactory } from '@eleven-am/xquery';
import { QueryResponse } from '@eleven-am/xquery/types';

const {
    createQueries,
    createMutations,
    createActions,
    createInfiniteQueries,
} = queryFactory({
    queryClientGetter: () => getClient().queryClient,
    clientGetter: (signal) => new Api<never>({
        securityWorker: () => ({
            signal,
        }),
    }),
    mapResponse: (toastError) => <T>(response: QueryResponse<T, HttpExceptionSchema>): T => {
        const result = mapResponse(response as HttpResponse<T, HttpExceptionSchema>, toastError);
        if (hasData(result)) {
            return result.data;
        }

        throw result.error;
    },
    mapQueryKey: (queryKey) => {
        const session = getClient().session;
        if (session) {
            return [session, ...queryKey];
        }

        return queryKey;
    }
});

export {
    createQueries,
    createMutations,
    createActions,
    createInfiniteQueries,
};
