import { FC, ReactNode } from 'react';

import { useSuspenseQuery, QueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { MediaType, SlimMediaSchema } from '@/api/data-contracts';
import { BannerHolder } from '@/components/banner-set/banner';
import { Delay } from '@/components/delay';
import { ErrorClient } from '@/components/errorClient';
import { GenresAndDecadesPickers } from '@/components/media/genresAndDecadesPickers';
import { Metadata } from '@/components/metadata';
import { mediaQueries, fetchMediaGridPageQuery } from '@/queries/media';

interface MediasPageProps {
    type: MediaType;
    genres: string[];
    decades: number[];
    selectedGenres: string[];
    banners: SlimMediaSchema[];
    defaultDecade: number;
}

type MediasSearch = z.infer<typeof mediaSearchSchema>;

interface Result {
    banners: SlimMediaSchema[];
    decades: number[];
    genres: string[];
}

interface LoaderOptions {
    component: FC;
    validateSearch: typeof mediaSearchSchema;
    loaderDeps: (search: { search: MediasSearch }) => MediasSearch;
    loader: (context: { context: { queryClient: QueryClient } }) => Promise<Result>;
    errorComponent: (props: { error: Error }) => ReactNode;
}

const mediaSearchSchema = z.object({
    genres: z.array(z.string())
        .optional()
        .default([]),
    decade: z.number().catch(0),
});

export function MediasPage ({ genres, decades, banners, type, selectedGenres, defaultDecade }: MediasPageProps) {
    const { data } = useSuspenseQuery(mediaQueries.filter(type, 0, []));

    return (
        <Delay showLoader delay={500}>
            <Metadata />
            <BannerHolder banners={banners} />
            <GenresAndDecadesPickers
                initialGrid={data}
                bannerDisplayed={banners.length > 0}
                genres={genres}
                decades={decades}
                type={type}
                defaultDecade={defaultDecade}
                selected={selectedGenres}
            />
        </Delay>
    );
}

export function getPageLoadOptions (type: MediaType, Component: FC): LoaderOptions {
    return {
        validateSearch: mediaSearchSchema,
        loaderDeps: ({ search }) => search,
        component: Component,
        loader: ({ context: { queryClient } }) => fetchMediaGridPageQuery(queryClient, type),
        errorComponent: ({ error }) => (
            <ErrorClient
                title={`Failed to load ${type.toLowerCase()} page`}
                message={(error as Error).message}
            />
        ),
    };
}
