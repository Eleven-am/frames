import { createFileRoute, getRouteApi } from '@tanstack/react-router';

import { ErrorClient } from '@/components/errorClient';
import { Loading } from '@/components/loading-set/Loading';
import { MediaPageComponent } from '@/components/media/mediaPage';
import { getMediaData } from '@/queries/media';


const routeApi = getRouteApi('/_protected/movie/$mediaId');

function MovieComponent () {
    const { mediaId } = routeApi.useParams();

    return (
        <MediaPageComponent mediaId={mediaId} />
    );
}

export const Route = createFileRoute('/_protected/movie/$mediaId')({
    component: MovieComponent,
    pendingComponent: Loading,
    loader: ({ params, context }) => getMediaData(params.mediaId, context),
    notFoundComponent: () => <ErrorClient
        title={'Movie not found'}
        message={'The movie you are looking for does not exist'}
    />,
    errorComponent: ({ error }) => (
        <ErrorClient
            title={'Unable to load movie'}
            message={(error as Error).message}
        />
    ),
});
