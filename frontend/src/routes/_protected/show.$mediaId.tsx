import { createFileRoute, getRouteApi } from '@tanstack/react-router';

import { ErrorClient } from '@/components/errorClient';
import { Loading } from '@/components/loading-set/Loading';
import { MediaPageComponent } from '@/components/media/mediaPage';
import { getMediaData } from '@/queries/media';

const routeApi = getRouteApi('/_protected/show/$mediaId');

function ShowComponent () {
    const { mediaId } = routeApi.useParams();

    return (
        <MediaPageComponent mediaId={mediaId} />
    );
}

export const Route = createFileRoute('/_protected/show/$mediaId')({
    component: ShowComponent,
    pendingComponent: Loading,
    loader: ({ params, context }) => getMediaData(params.mediaId, context),
    notFoundComponent: () => <ErrorClient
        title={'Show not found'}
        message={'The show you are looking for does not exist'}
    />,
    errorComponent: ({ error }) => (
        <ErrorClient
            title={'Unable to load show'}
            message={(error as Error).message}
        />
    ),
});
