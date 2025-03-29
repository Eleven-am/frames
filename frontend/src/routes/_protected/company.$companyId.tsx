import { useMemo } from 'react';

import { QueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, getRouteApi } from '@tanstack/react-router';

import { CarouselItem, CarouselImagesContainer } from '@/components/carousel';
import { CompanyDesktop } from '@/components/company/companyDesktop';
import { CompanyDetails } from '@/components/company/companyDetails';
import { CompanyMobile } from '@/components/company/companyMobile';
import { ErrorClient } from '@/components/errorClient';
import { Loading } from '@/components/loading-set/Loading';
import { Metadata } from '@/components/metadata';
import { miscQueries } from '@/queries/misc';
import { dedupeBy } from '@/utils/arrayFunctions';


const routeApi = getRouteApi('/_protected/company/$companyId');

async function getCompanyDataById (companyId: string, client: QueryClient) {
    await client.ensureQueryData(miscQueries.company(companyId));
}

function CompanyPage () {
    const { companyId } = routeApi.useParams();
    const { data } = useSuspenseQuery(miscQueries.company(companyId));

    const carousels = useMemo((): CarouselItem[] => dedupeBy([...data.movies, ...data.shows], 'id')
        .map((item) => ({
            image: item.poster,
            blur: item.posterBlur,
            name: item.name,
        })),
    [data]);

    return (
        <CarouselImagesContainer items={carousels} carouselClassName={'opacity-20'}>
            <Metadata
                metadata={
                    {
                        name: data.name,
                        poster: data.logo,
                        link: `/c=${companyId}`,
                        overview: `See all the movies and shows from ${data.name}`,
                    }
                }
            />
            <CompanyDesktop company={data} />
            <CompanyMobile company={data} />
            <CompanyDetails company={data} />
        </CarouselImagesContainer>
    );
}

export const Route = createFileRoute('/_protected/company/$companyId')({
    component: CompanyPage,
    pendingComponent: Loading,
    loader: ({ context, params }) => getCompanyDataById(params.companyId, context.queryClient),
    errorComponent: ({ error }) => <ErrorClient
        title={'Error fetching company data'}
        message={(error as Error).message}
    />,
    notFoundComponent: () => <ErrorClient
        title={'Company not found'}
        message={'The company you are looking for does not exist'}
    />,
});
