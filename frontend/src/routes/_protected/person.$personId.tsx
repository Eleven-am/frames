import { QueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, getRouteApi } from '@tanstack/react-router';

import { HomeResponseTypes } from '@/api/data-contracts';
import { BasicDetails } from '@/components/basicDetails';
import { ErrorClient } from '@/components/errorClient';
import { Loading } from '@/components/loading-set/Loading';
import { miscQueries } from '@/queries/misc';

const routeApi = getRouteApi('/_protected/person/$personId');

async function getPersonDataById (personId: string, client: QueryClient) {
    await client.ensureQueryData(miscQueries.person(personId));
}

function PersonPage () {
    const { personId } = routeApi.useParams();
    const { data: person } = useSuspenseQuery(miscQueries.person(personId));

    return (
        <BasicDetails
            photo={person.profile || ''}
            name={person.name}
            description={person.biography}
            link={`/p=${person.name.replace(/ /g, '+')}`}
            sections={
                [
                    {
                        type: HomeResponseTypes.CLASSIC,
                        results: person.staredIn,
                        label: `Media ${person.name} stared in`,
                        identifier: 'staredIn',
                    },
                    {
                        type: HomeResponseTypes.BASIC,
                        results: person.wroteFor,
                        label: `Media ${person.name} wrote for`,
                        identifier: 'wroteFor',
                    },
                    {
                        type: HomeResponseTypes.CLASSIC,
                        results: person.directed,
                        label: `Media ${person.name} directed`,
                        identifier: 'directed',
                    },
                    {
                        type: HomeResponseTypes.BASIC,
                        results: person.produced,
                        label: `Media ${person.name} produced`,
                        identifier: 'produced',
                    },
                ]
            }
        />
    );
}


export const Route = createFileRoute('/_protected/person/$personId')({
    component: PersonPage,
    pendingComponent: Loading,
    loader: ({ context, params }) => getPersonDataById(params.personId, context.queryClient),
    errorComponent: ({ error }) => <ErrorClient
        title={'Error fetching person data'}
        message={(error as Error).message}
    />,
    notFoundComponent: () => <ErrorClient
        title={'Person not found'}
        message={'The person you are looking for does not exist'}
    />,
});
