import { QueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, getRouteApi } from '@tanstack/react-router';

import { HomeResponseTypes } from '@/api/data-contracts';
import { BasicDetails } from '@/components/basicDetails';
import { ErrorClient } from '@/components/errorClient';
import { Loading } from '@/components/loading-set/Loading';
import { miscQueries } from '@/queries/misc';

const routeApi = getRouteApi('/_protected/collection/$collectionId');

async function getCollectionDataById (collectionId: string, client: QueryClient) {
    await client.ensureQueryData(miscQueries.collection(collectionId));
}

export function CollectionPage () {
    const { collectionId } = routeApi.useParams();
    const { data: collection } = useSuspenseQuery(miscQueries.collection(collectionId));

    return (
        <BasicDetails
            name={collection.name}
            photo={collection.poster || ''}
            description={collection.description}
            link={`/col=${collection.name.replace(/ /g, '+')}`}
            sections={
                [
                    {
                        identifier: 'collection',
                        type: HomeResponseTypes.EDITOR,
                        results: collection.media,
                        label: `media in ${collection.name}`,
                    },
                ]
            }
        />
    );
}

export const Route = createFileRoute('/_protected/collection/$collectionId')({
    component: CollectionPage,
    pendingComponent: Loading,
    loader: ({ context, params }) => getCollectionDataById(params.collectionId, context.queryClient),
    errorComponent: ({ error }) => <ErrorClient
        title={'Error fetching collection data'}
        message={(error as Error).message}
    />,
    notFoundComponent: () => <ErrorClient
        title={'Collection not found'}
        message={'The collection you are looking for does not exist'}
    />,
});
