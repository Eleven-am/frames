import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { ErrorClient } from '@/components/errorClient';
import { HorizontalRecommendations } from '@/components/horizontalRecommendations';
import { Loading } from '@/components/loading-set/Loading';
import { Metadata } from '@/components/metadata';
import { listQueries } from '@/queries/list';

function MyListComponent () {
    const { data } = useSuspenseQuery(listQueries.myListPage);

    if (data.length === 0) {
        return (
            <ErrorClient
                title={'You have no media in your list'}
                message={'Add some media to your list to see it here'}
            />
        );
    }

    return (
        <>
            <Metadata title={'My List'} />
            <HorizontalRecommendations response={data} />
        </>
    );
}

export const Route = createFileRoute('/_protected/list')({
    pendingComponent: Loading,
    component: MyListComponent,
    errorComponent: ({ error }) => <ErrorClient
        title={'Error fetching list data'}
        message={(error as Error).message}
    />,
});
