import { formatDistanceToNow } from 'date-fns';

import { SlimMediaSchema,
    CastResponseSchema,
    MediaExtrasSchema,
    EpisodeResponseSchema,
    ContinueWatchingItemSchema } from '@/api/data-contracts';
import { FlatList } from '@/components/flatList';
import { Recommendation,
    LargeRecommendation,
    Cast,
    Extra,
    EpisodeComponent,
    ContinueWatching } from '@/components/listItem';
import { UseFlatListOptions } from '@/hooks/useFlatList';
import { dedupeBy } from '@/utils/arrayFunctions';


export enum ImageListType {
    Recommendations = 'Recommendations',
    LargeRecommendations = 'LargeRecommendations',
    Cast = 'Cast',
    ExtraVideos = 'ExtraVideos',
    EpisodeList = 'EpisodeList',
    ContinueWatching = 'ContinueWatching',
}

interface RecommendedMediaProps {
    options?: UseFlatListOptions;
    type: ImageListType.Recommendations | ImageListType.LargeRecommendations;
    data: SlimMediaSchema[];
    hideLabel?: boolean;
}

interface CastPeopleProps {
    type: ImageListType.Cast;
    options?: UseFlatListOptions;
    data: CastResponseSchema[];
}

interface ExtraVideosProps {
    type: ImageListType.ExtraVideos;
    options?: UseFlatListOptions;
    data: MediaExtrasSchema[];
}

interface EpisodeListProps {
    type: ImageListType.EpisodeList;
    options?: UseFlatListOptions;
    data: (EpisodeResponseSchema & { percentage: number })[];
}

interface ContinueWatchingProps {
    type: ImageListType.ContinueWatching;
    options?: UseFlatListOptions;
    data: ContinueWatchingItemSchema[];
}

export type PosterHorizontalListProps = (RecommendedMediaProps | CastPeopleProps | ExtraVideosProps | ContinueWatchingProps | EpisodeListProps) & { className?: string };

interface ImageListSkeletonProps {
    type: ImageListType.Recommendations | ImageListType.LargeRecommendations;
}

function toDistance (date: string) {
    try {
        return formatDistanceToNow(date, {
            addSuffix: true,
        });
    } catch (error) {
        const dateObj = new Date(date);

        if (dateObj.toString() === 'Invalid Date') {
            return '';
        }

        return formatDistanceToNow(dateObj, {
            addSuffix: true,
        });
    }
}

function Mapper (props: PosterHorizontalListProps & { hideLabel?: boolean }) {
    if (props.type === ImageListType.Recommendations) {
        return (
            <>
                {
                    dedupeBy(props.data, 'id')
                        .map((media) => (
                            <Recommendation
                                key={media.id}
                                type={media.type}
                                posterBlur={media.posterBlur}
                                poster={media.poster}
                                name={media.name}
                                id={media.id}
                            />
                        ))
                }
            </>
        );
    }

    if (props.type === ImageListType.LargeRecommendations) {
        return (
            <>
                {
                    dedupeBy(props.data, 'id')
                        .map((media) => (
                            <LargeRecommendation
                                key={media.id}
                                name={media.name}
                                id={media.id}
                                logo={media.logo}
                                type={media.type}
                                logoBlur={media.logoBlur}
                                backdropBlur={media.backdropBlur}
                                backdrop={media.backdrop}
                                hideLabel={props.hideLabel}
                            />
                        ))
                }
            </>
        );
    }

    if (props.type === ImageListType.Cast) {
        return (
            <>
                {
                    dedupeBy(props.data, 'tmdbId')
                        .map((cast) => <Cast key={cast.tmdbId} cast={cast} />)
                }
            </>
        );
    }

    if (props.type === ImageListType.ExtraVideos) {
        return (
            <>
                {
                    dedupeBy(props.data, 'youtubeId')
                        .map((video) => (
                            <Extra
                                name={video.name}
                                key={video.youtubeId}
                                thumbnail={video.thumbnail}
                                youtubeId={video.youtubeId}
                                dateDisplay={toDistance(video.publishedAt)}
                            />
                        ))
                }
            </>
        );
    }

    if (props.type === ImageListType.EpisodeList) {
        return (
            <>
                {
                    dedupeBy(props.data, 'id')
                        .map((episode) => (
                            <EpisodeComponent
                                key={episode.id}
                                percentage={episode.percentage}
                                episode={episode}
                            />
                        ))
                }
            </>
        );
    }

    if (props.type === ImageListType.ContinueWatching) {
        return (
            <>
                {
                    dedupeBy(props.data, 'id')
                        .map((item) => (
                            <ContinueWatching
                                key={item.id}
                                name={item.name}
                                id={item.id}
                                logo={item.logo}
                                type={item.type}
                                logoBlur={item.logoBlur}
                                backdropBlur={item.backdropBlur}
                                backdrop={item.backdrop}
                                percentage={item.percentage}
                                videoId={item.videoId}
                            />
                        ))
                }
            </>
        );
    }

    return null;
}

function SkeletonMapper (props: ImageListSkeletonProps) {
    if (props.type === ImageListType.Recommendations) {
        return (
            <>
                <Recommendation.Skeleton />
                <Recommendation.Skeleton />
                <Recommendation.Skeleton />
                <Recommendation.Skeleton />
                <Recommendation.Skeleton />
                <Recommendation.Skeleton />
                <Recommendation.Skeleton />
                <Recommendation.Skeleton />
            </>
        );
    }

    if (props.type === ImageListType.LargeRecommendations) {
        return (
            <>
                <LargeRecommendation.Skeleton />
                <LargeRecommendation.Skeleton />
                <LargeRecommendation.Skeleton />
                <LargeRecommendation.Skeleton />
                <LargeRecommendation.Skeleton />
                <LargeRecommendation.Skeleton />
                <LargeRecommendation.Skeleton />
                <LargeRecommendation.Skeleton />
            </>
        );
    }

    return null;
}

export function ImageList (props: PosterHorizontalListProps) {
    const { options, className, data } = props;

    if (!data || data.length === 0) {
        return null;
    }

    return (
        <FlatList options={options} className={className}>
            <Mapper {...props} />
        </FlatList>
    );
}

ImageList.Skeleton = (props: ImageListSkeletonProps) => (
    <FlatList.Skeleton>
        <SkeletonMapper {...props} />
    </FlatList.Skeleton>
);
