import { DetailedMediaSchema, HomeResponseTypes } from '@/api/data-contracts';
import { ErrorClient } from '@/components/errorClient';
import { DesktopBanners } from '@/components/index/desktopBanners';
import { EditorPick } from '@/components/index/editorPick';
import { HomePicks } from '@/components/index/homePicks';
import { ContinueWatchingResponseList, HomeResponseSuspendable } from '@/components/index/homeResponseList';
import { MobileBanners } from '@/components/index/mobileBanners';
import { Metadata } from '@/components/metadata';
import { IRouterContext } from '@/hooks/useClientAction';
import { useLoop } from '@/hooks/useIntervals';
import { useNavBarOpacity } from '@/hooks/useNavBarOpacity';
import { useBlurActions } from '@/providers/blurProvider';
import { indexQueries } from '@/queries';
import { listQueries } from '@/queries/list';

import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, getRouteApi } from '@tanstack/react-router';
import { useScroll, useTransform } from 'framer-motion';
import { Suspense, useEffect, useMemo, useRef } from 'react';


const routeApi = getRouteApi('/_protected/');

interface IndexBannerProps {
    trending: DetailedMediaSchema[];
    count: {
        editor: number;
        basic: number;
    };
}

const duration = 20;

export function IndexComponent () {
    const { setBlur } = useBlurActions();
    const ref = useRef(null);
    const { trending, count } = routeApi.useLoaderData();
    const { data: myList } = useSuspenseQuery(listQueries.myList);
    const mediaInList = useMemo(() => myList.results.map((item) => item.id), [myList]);

    const bannerData = useMemo(() => trending
        .slice(0, 7)
        .map((item) => {
            const isInList = mediaInList.includes(item.id);

            return {
                ...item,
                isInList,
            };
        }), [trending, mediaInList]);

    const { carousel, current, direction, pause, isPaused, restart, jumpTo } = useLoop(bannerData, duration);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });

    const navOpacity = useTransform(scrollYProgress, [0.2, 1], [0, 1]);

    useNavBarOpacity(navOpacity);

    useEffect(() => setBlur(carousel[current]?.data.backdropBlur), [carousel, current, setBlur]);

    return (
        <div className={'relative ipadMini:pt-[76vh] overflow-y-scroll scrollbar-hide'}>
            <Metadata />
            <DesktopBanners
                scrollYProgress={scrollYProgress}
                carousel={carousel}
                pause={pause}
                restart={restart}
                isPaused={isPaused}
                direction={direction}
                duration={duration}
            />
            <MobileBanners
                jumpTo={jumpTo}
                current={current}
                carousel={carousel}
                direction={direction}
                duration={duration}
            />
            <div ref={ref} />
            <div>
                <Suspense fallback={<HomeResponseSuspendable.Skeleton type={HomeResponseTypes.BASIC} />}>
                    <HomeResponseSuspendable query={listQueries.myList} />
                </Suspense>
                <Suspense fallback={<HomeResponseSuspendable.Skeleton type={HomeResponseTypes.CONTINUE_WATCHING} />}>
                    <ContinueWatchingResponseList />
                </Suspense>
                <Suspense fallback={<HomeResponseSuspendable.Skeleton type={HomeResponseTypes.BASIC} />}>
                    <HomeResponseSuspendable query={indexQueries.popular} />
                </Suspense>
                <Suspense fallback={<HomeResponseSuspendable.Skeleton type={HomeResponseTypes.EDITOR} />}>
                    <HomeResponseSuspendable query={indexQueries.recommended} />
                </Suspense>
                <Suspense fallback={<HomeResponseSuspendable.Skeleton type={HomeResponseTypes.BASIC} />}>
                    <HomeResponseSuspendable query={indexQueries.recentlyAdded} />
                </Suspense>
                <Suspense fallback={<HomeResponseSuspendable.Skeleton type={HomeResponseTypes.BASIC} />}>
                    <HomeResponseSuspendable query={indexQueries.airingToday} />
                </Suspense>
                <Suspense fallback={<HomeResponseSuspendable.Skeleton type={HomeResponseTypes.BASIC} />}>
                    <HomeResponseSuspendable query={indexQueries.nowPlaying} />
                </Suspense>
                <Suspense fallback={<HomeResponseSuspendable.Skeleton type={HomeResponseTypes.BASIC} />}>
                    <HomeResponseSuspendable query={indexQueries.whatOthersAreWatching} />
                </Suspense>
                <Suspense fallback={<HomeResponseSuspendable.Skeleton type={HomeResponseTypes.BASIC} />}>
                    <HomeResponseSuspendable query={indexQueries.topRated} />
                </Suspense>
                <Suspense fallback={<HomeResponseSuspendable.Skeleton type={HomeResponseTypes.BASIC} />}>
                    <EditorPick />
                </Suspense>
                <Suspense fallback={<HomeResponseSuspendable.Skeleton type={HomeResponseTypes.EDITOR} />}>
                    <HomeResponseSuspendable query={indexQueries.rated} />
                </Suspense>
                <HomePicks pickCount={count} />
            </div>
        </div>
    );
}

async function getIndexData ({ queryClient }: IRouterContext): Promise<IndexBannerProps> {
    await queryClient.ensureQueryData(listQueries.myList);
    const trending = await queryClient.ensureQueryData(indexQueries.trending);
    const picksCount = await queryClient.ensureQueryData(indexQueries.picksCount);

    return {
        trending,
        count: picksCount,
    };
}

export const Route = createFileRoute('/_protected/')({
    component: IndexComponent,
    loader: ({ context }) => getIndexData(context),
    errorComponent: ({ error }) => <ErrorClient
        title={'Error fetching banner data'}
        message={(error as Error).message}
    />,
});
