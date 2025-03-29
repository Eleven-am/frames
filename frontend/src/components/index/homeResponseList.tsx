import { HomeResponseSlimMediaSchema, HomeResponseTypes, HttpExceptionSchema } from '@/api/data-contracts';
import { ImageListType, ImageList } from '@/components/imageList';
import { indexQueries } from '@/queries';

import { QueryKey } from '@tanstack/query-core';
import { useSuspenseQuery, UseSuspenseQueryOptions } from '@tanstack/react-query';
import { useMemo } from 'react';


interface HomeResponseListProps {
    data: HomeResponseSlimMediaSchema;
}

export interface HomeResponseSkeletonProps {
    type: HomeResponseTypes;
}

function mapTypes (type: HomeResponseTypes) {
    switch (type) {
        case HomeResponseTypes.EDITOR:
        case HomeResponseTypes.CONTINUE_WATCHING:
            return ImageListType.LargeRecommendations;
        default:
            return ImageListType.Recommendations;
    }
}

export function HomeResponseList ({ data }: HomeResponseListProps) {
    const imageListType = useMemo(() => mapTypes(data.type), [data.type]);

    if (!data.results || data.results.length === 0) {
        return null;
    }

    return (
        <>
            <div className={'relative w-full text-md text-lightest px-6 ipadMini:px-12 mt-4'}>
                {data.label.toLowerCase()}
            </div>
            <ImageList type={imageListType} data={data.results} hideLabel />
        </>
    );
}

export function HomeResponseSuspendable <TQueryKey extends QueryKey> ({ query }: { query: UseSuspenseQueryOptions<HomeResponseSlimMediaSchema, HttpExceptionSchema, HomeResponseSlimMediaSchema, TQueryKey> }) {
    const { data } = useSuspenseQuery(query);

    if (!data) {
        return null;
    }

    return (
        <HomeResponseList data={data} />
    );
}

HomeResponseSuspendable.Skeleton = ({ type }: HomeResponseSkeletonProps) => (
    <>
        <div className={'relative w-72 animate-pulse bg-dark-700 h-5 mx-6 ipadMini:mx-12 mt-4 rounded-md'} />
        <ImageList.Skeleton type={mapTypes(type)} />
    </>
);

export function ContinueWatchingResponseList () {
    const { data, isError } = useSuspenseQuery(indexQueries.continueWatching);

    if (isError || !data || !data.results || data.results.length === 0) {
        return null;
    }

    return (
        <>
            <div className={'relative w-full text-md text-lightest px-6 ipadMini:px-12 mt-4'}>
                {data.label.toLowerCase()}
            </div>
            <ImageList type={ImageListType.ContinueWatching} data={data.results} />
        </>
    );
}

