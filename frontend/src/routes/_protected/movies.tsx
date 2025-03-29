import { createFileRoute, getRouteApi } from '@tanstack/react-router';

import { MediaType } from '@/api/data-contracts';
import { getPageLoadOptions, MediasPage } from '@/components/media/mediaaPage';

const routeApi = getRouteApi('/_protected/movies');

function MoviesComponent () {
    const { genres, decades, banners } = routeApi.useLoaderData();
    const { genres: selectedGenres, decade } = routeApi.useSearch();

    return (
        <MediasPage
            genres={genres}
            decades={decades}
            banners={banners}
            type={MediaType.MOVIE}
            defaultDecade={decade}
            selectedGenres={selectedGenres}
        />
    );
}

export const Route = createFileRoute('/_protected/movies')(getPageLoadOptions(MediaType.MOVIE, MoviesComponent));
