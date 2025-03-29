import { CastResponseSchema, EpisodeResponseSchema, MediaType } from '@/api/data-contracts';
import { LazyImage } from '@/components/lazyImage';
import { LinkType, useMediaLink, useVerticalInformationLink } from '@/hooks/useMediaLink';
import { useYoutubeActions } from '@/providers/youtubeProvider';
import { createStyles } from '@/utils/colour';
import { tw } from '@/utils/style';

import { Link } from '@tanstack/react-router';
import { CSSProperties, HTMLAttributes, MouseEvent, ReactNode, useCallback, useMemo, useRef } from 'react';
import { BsFillEyeFill } from 'react-icons/bs';


interface EpisodeProps {
    episode: EpisodeResponseSchema;
    percentage?: number;
}

interface RecommendationProps {
    posterBlur: string;
    poster: string;
    name: string;
    id: string;
    type: MediaType;
    className?: string;
}

interface MediaLinkProps {
    id: string;
    name: string;
    type: MediaType;
    style?: CSSProperties;
    className?: string;
    children: ReactNode;
    onClick?: () => void;
}

interface MediaLinkDivProps extends HTMLAttributes<HTMLDivElement> {
    mediaId: string;
    name: string;
    mediaType: MediaType;
}

export interface ExtraProps {
    name: string;
    className?: string;
    thumbnail: string;
    youtubeId: string;
    dateDisplay: string;
}

interface LargeRecommendationProps {
    logoBlur: string | null;
    backdropBlur: string;
    logo: string | null;
    backdrop: string;
    className?: string;
    hideLabel?: boolean;
    percentage?: number;
    name: string;
    id: string;
    type: MediaType;
}

interface ContinueWatchingProps extends Omit<LargeRecommendationProps, 'hideLabel'> {
    percentage?: number;
    videoId: string;
}

interface PortraitProps {
    posterBlur: string;
    portrait: string;
    name: string;
    id: string;
    type: MediaType;
    className?: string;
    liClassName?: string;
}

interface CastProps {
    cast: CastResponseSchema;
}

export interface PlaylistItemProps {
    id: string;
    name: string;
    overview: string;
    isPublic: boolean;
    backdrop: string;
    videoCount: number;
    hidePublic: boolean;
}

export function MediaLink ({ id, className, children, style, type, name, onClick }: MediaLinkProps) {
    const { link: { params, mask, pathname } } = useMediaLink({
        id,
        name,
        type,
    });

    return (
        <Link
            style={style}
            className={className}
            to={pathname}
            params={params}
            mask={mask}
            onClick={onClick}
        >
            {children}
        </Link>
    );
}

export function MediaLinkDiv ({ mediaId, mediaType, onClick, name, className, ...props }: MediaLinkDivProps) {
    const divRef = useRef<HTMLDivElement>(null);
    const { navigateToLink } = useMediaLink();

    const handleClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (onClick) {
            onClick(e);
        }

        navigateToLink({
            id: mediaId,
            name,
            type: mediaType,
        });
    }, [mediaId, mediaType, name, navigateToLink, onClick]);

    return (
        <div
            {...props}
            ref={divRef}
            onClick={handleClick}
            className={tw('cursor-pointer', className)}
        />
    );
}

export function EpisodeComponent ({ episode, percentage = 0 }: EpisodeProps) {
    return (
        <Link
            to={'/watch'}
            search={
                {
                    episodeId: episode.id,
                }
            }
        >
            <li
                className={'group mx-2 ipadMini:w-80 w-64 hover:scale-105 cursor-pointer transition-all duration-200 ease-in-out flex flex-col'}
            >
                <div
                    className={'relative flex flex-col items-center justify-center w-full'}
                >
                    <LazyImage
                        className={'object-cover w-full aspect-video rounded-lg shadow-dark-900/50 shadow-lg backdrop-blur-lg bg-black/50 group-hover:shadow-dark-900 group-hover:shadow-lg group-hover:border-2 group-hover:border-lightest transition-all duration-200 ease-in-out'}
                        src={episode.photo}
                        alt={episode.name}
                    />
                    <div
                        className={
                            tw('absolute h-1 rounded-md w-11/12 bottom-2 bg-darkM/40', {
                                hidden: percentage === 0 || percentage >= 95,
                            })
                        }
                    >
                        <div
                            className={'h-full rounded-md bg-lightL'}
                            style={
                                {
                                    width: `${percentage}%`,
                                }
                            }
                        />
                    </div>
                    <BsFillEyeFill
                        className={
                            tw('absolute top-0 right-0 w-6 h-6 m-1 pt-0.5 flex flex-col items-center justify-center rounded-full', {
                                hidden: percentage < 95,
                            })
                        }
                        style={
                            {
                                filter: 'drop-shadow(0 2px 2px rgb(0 0 0 / 0.7))',
                            }
                        }
                    />
                </div>
                <div className={'flex flex-col items-start justify-center w-full'}>
                    <span className={'mt-2 w-full font-bold line-clamp-1 text-light-700 group-hover:text-light-900'}>
                        {episode.episode} - {episode.name}
                    </span>
                    <span className={'mt-2 text-sm line-clamp-3 text-light-400 group-hover:text-light-700'}>
                        {episode.overview}
                    </span>
                </div>
            </li>
        </Link>
    );
}

export function Extra (props: ExtraProps) {
    const { playVideo } = useYoutubeActions();

    const handleClick = useCallback(() => playVideo(props.youtubeId), [playVideo, props.youtubeId]);

    return (
        <li className={props.className}>
            <div
                onClick={handleClick}
                className={'group mx-2 ipadMini:w-80 w-64 hover:scale-105 cursor-pointer transition-all duration-200 ease-in-out flex flex-col'}
            >
                <LazyImage
                    className={'object-cover w-full aspect-video shadow-md shadow-dark-900/50 group-hover:shadow-dark-900 group-hover:shadow-lg rounded-lg backdrop-blur-lg bg-black/50 group-hover:border-2 group-hover:border-lightest transition-all duration-200 ease-in-out'}
                    src={props.thumbnail}
                    loading={'eager'}
                    alt={props.name}
                />
                <div className={'flex flex-col items-start justify-center w-full text-light-600 group-hover:text-light-800'}>
                    <span className={'mt-2 w-full font-bold line-clamp-2'}>
                        {props.name}
                    </span>
                    <span className={'opacity-75 text-xs'}>
                        {props.dateDisplay}
                    </span>
                </div>
            </div>
        </li>
    );
}

export function Recommendation (props: RecommendationProps) {
    const style = useMemo(() => ({
        backgroundColor: `rgba(${props.posterBlur} 0.4)`,
    }), [props.posterBlur]);

    return (
        <MediaLink
            id={props.id}
            type={props.type}
            name={props.name}
            className={props.className}
        >
            <li
                className={'group mx-2 w-56 ipadPro:w-64 imac:w-80 flex justify-center'}
                title={props.name}
            >
                <LazyImage
                    className={'w-full aspect-video object-contain shadow-dark-900/50 group-hover:shadow-dark-900 shadow-lg transition-all duration-200 ease-in-out group-hover:scale-105 cursor-pointer rounded-lg backdrop-blur-lg bg-black/50 group-hover:border-2 group-hover:border-lightest'}
                    src={props.poster}
                    alt={props.name}
                    style={style}
                />
            </li>
        </MediaLink>
    );
}

Recommendation.Skeleton = () => (
    <li
        className={'animate-pulse bg-dark-700 min-w-64 flex aspect-video ipadMini:min-w-80 mx-2 justify-center shadow-dark-900/50 shadow-lg rounded-lg'}
    />
);

export function NoLinkLargeRecommendation ({
    percentage = 0,
    ...props
}: LargeRecommendationProps) {
    return (
        <li
            style={createStyles(props.logoBlur || props.backdropBlur, [7], true)}
            className={
                tw('group w-64 cursor-pointer pb-2 mx-2 flex flex-col text-lightest', {
                    'ipadMini:w-96': props.hideLabel,
                    'ipadMini:w-80': !props.hideLabel,
                })
            }
        >
            <div
                className={'relative flex flex-col items-center justify-center w-full group-hover:scale-105 transition-all duration-200 ease-in-out '}
            >
                <LazyImage
                    loading={'lazy'}
                    className={'object-cover bg-backdrop-blur/40 w-full aspect-video rounded-lg shadow-dark-900/50 group-hover:shadow-dark-900 shadow-lg backdrop-blur-lg group-hover:border-2 group-hover:border-lightest transition-all duration-200 ease-in-out'}
                    src={props.backdrop}
                    alt={props.name}
                />
                <div
                    className={
                        tw('absolute h-1 rounded-md w-11/12 bottom-3 bg-darkM/40', {
                            hidden: percentage === 0,
                        })
                    }
                >
                    <div
                        className={'h-full rounded-md bg-lightM'}
                        style={
                            {
                                width: `${percentage}%`,
                            }
                        }
                    />
                </div>
                <div
                    className={
                        tw('absolute bottom-0 left-0 flex items-center justify-center w-2/5 h-1/4 m-4 p-1 rounded-md bg-dark-700/70', {
                            'mb-6': percentage !== 0,
                        })
                    }
                >
                    {
                        props.logo
                            ? <LazyImage
                                className={'object-contain w-full h-full'}
                                src={props.logo}
                                alt={props.name}
                            /> :
                            <span
                                className={'text-md text-lightest font-bold text-shadow-lg text-center line-clamp-2 font-frames'}
                            >
                                {props.name}
                            </span>
                    }
                </div>
            </div>
            {
                !props.hideLabel && (
                    <div className={'flex items-center justify-center w-full'}>
                        <span className={'mt-3 font-bold line-clamp-1 relative text-shadow-sm'}>
                            {props.name}
                        </span>
                    </div>
                )
            }
        </li>
    );
}

export function LargeRecommendation (props: LargeRecommendationProps) {
    return (
        <MediaLink
            id={props.id}
            type={props.type}
            name={props.name}
            className={props.className}
        >
            <NoLinkLargeRecommendation {...props} />
        </MediaLink>
    );
}

LargeRecommendation.Skeleton = () => (
    <li
        className={'flex min-w-64 animate-pulse bg-dark-700 ipadMini:min-w-96 mx-2 justify-center aspect-video shadow-dark-900/75 shadow-xl rounded-lg'}
    />
);

export function ContinueWatching ({ videoId, ...props }: ContinueWatchingProps) {
    return (
        <Link
            className={props.className}
            to={'/watch'}
            search={
                {
                    videoId,
                }
            }
        >
            <NoLinkLargeRecommendation {...props} hideLabel />
        </Link>
    );
}

export function Portrait ({ posterBlur, portrait, name, id, className, liClassName, type }: PortraitProps) {
    return (
        <MediaLink
            id={id}
            type={type}
            name={name}
            className={className}
        >
            <li
                title={name}
                style={createStyles(posterBlur, [4], true)}
                className={tw('group mx-2 cursor-pointer flex flex-col text-lightest transition-all duration-300 ease-in-out w-36 fullHD:w-52', liClassName)}
            >
                <LazyImage
                    className={'bg-dark-400/40 w-full object-contain aspect-[2/3] rounded-lg shadow-black shadow-lg backdrop-blur-lg group-hover:border-2 group-hover:border-lightest transition-all duration-200 ease-in-out'}
                    src={portrait}
                    alt={name}
                />
            </li>
        </MediaLink>
    );
}

Portrait.Skeleton = () => (
    <li
        className={'w-36 fullHD:w-52 flex justify-center'}
    >
        <div
            className={'w-full animate-pulse bg-lightL aspect-[2/3] object-contain shadow-black shadow-lg rounded-lg'}
        />
    </li>
);

export function Cast ({ cast }: CastProps) {
    const { profilePath, name, character } = cast;
    const { pathname, params, mask } = useVerticalInformationLink(LinkType.PERSON, cast);

    if (!profilePath || !name || !character || (/w500null/).test(profilePath)) {
        return null;
    }

    return (
        <Link
            to={pathname}
            params={params}
            mask={mask}
        >
            <li
                className={'w-28 ipadMini:w-44 max-ipadMini:m-2 ipadMini:my-2 flex flex-col justify-center items-center'}
            >
                <LazyImage
                    className={'object-cover w-4/5 aspect-square rounded-full shadow-lg hover:scale-105 hover:border-2 hover:border-lightest transition-all duration-100 ease-in-out'}
                    src={profilePath}
                    loading={'eager'}
                    alt={name}
                />
                <div className={'text-center text-xs ipadMini:text-sm mt-2 w-full'}>
                    <p className={'font-bold whitespace-nowrap'}>{name}</p>
                    <p className={'line-clamp-1 text-light-600'}>
                        {character}
                    </p>
                </div>
            </li>
        </Link>
    );
}

export function PlaylistItem ({ id, name, backdrop, overview, videoCount, isPublic, hidePublic }: PlaylistItemProps) {
    return (
        <Link
            to={'/playlist/$playlistId'}
            params={
                {
                    playlistId: id,
                }
            }
            mask={
                {
                    to: `/pl=${id}` as string,
                }
            }
        >
            <li
                className={'group mx-2 fullHD:w-80 w-64 hover:scale-105 cursor-pointer transition-all duration-200 ease-in-out flex flex-col'}
            >
                <div
                    className={'relative flex flex-col items-center justify-center w-full'}
                >
                    <LazyImage
                        loading={'eager'}
                        className={'bg-backdrop-blur object-cover w-full aspect-video rounded-lg shadow-md shadow-dark-900/50 group-hover:shadow-dark-900 group-hover:shadow-lg backdrop-blur-lg bg-black/50 group-hover:border-2 group-hover:border-lightest transition-all duration-200 ease-in-out'}
                        src={backdrop}
                        alt={name}
                    />
                </div>
                <div className={'relative flex flex-col items-start justify-center w-full'}>
                    <span className={'mt-2 w-3/5 font-bold line-clamp-1 text-light-600/40 shadow-dark-800/50 text-shadow-sm'}>
                        {name}
                    </span>
                    <span className={'mt-2 text-gray-400 text-sm line-clamp-3'}>
                        {overview}
                    </span>
                    <div className={'absolute flex items-center justify-end top-0 right-0 mt-2 text-gray-400 gap-x-2 mr-2 text-sm line-clamp-3'}>
                        <span>{videoCount} videos</span>
                        {
                            hidePublic
                                ? null :
                                <>
                                    <span>•</span>
                                    <span className={'border border-gray-400 rounded-md px-1'}>{isPublic ? 'Public' : 'Private'}</span>
                                </>
                        }
                    </div>
                </div>
            </li>
        </Link>
    );
}
