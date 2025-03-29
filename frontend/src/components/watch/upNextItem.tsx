import { ReactNode } from 'react';

import { useQuery } from '@tanstack/react-query';

import { MediaType } from '@/api/data-contracts';
import { InfoButton } from '@/components/framesButtons';
import { LazyImage } from '@/components/lazyImage';
import { PlaybackButton } from '@/components/watch/subtitles';
import { UpNextPlayButton, UpNextWrapper } from '@/components/watch/upNextClient';
import { useInformProgress } from '@/hooks/useInformProgress';
import { watchQueries } from '@/queries/watch';
import { createStyles } from '@/utils/colour';


interface UpNextItemProps {
    mediaType: MediaType;
    children: ReactNode;
    playbackId: string;
    mediaName: string;
    mediaId: string;
}

export function UpNextItem ({ children, playbackId, mediaType, mediaName, mediaId }: UpNextItemProps) {
    const { data } = useQuery(watchQueries.upNext(playbackId));

    useInformProgress(playbackId);

    return (
        <>
            {
                data !== undefined && (
                    <div
                        style={createStyles(data.backdropBlur)}
                        className={'absolute w-full h-full top-0 left-0 flex justify-center items-center overflow-hidden text-shadow-sm text-light-900'}
                    >
                        <LazyImage
                            src={data.backdrop}
                            alt={data.name}
                            loading={'eager'}
                            className={'w-full h-full object-cover'}
                        />
                        <div className={'fixed top-0 left-0 w-full h-full bg-gradient-to-t from-darkD/80 to-transparent'} />
                        <div className={'fixed top-0 left-0 w-full h-full bg-gradient-to-tr from-darkD/80 to-transparent'} />
                        <div className={'fixed top-0 left-0 w-full h-full bg-gradient-to-r from-darkD/80 to-transparent'} />
                        <div
                            className={'absolute w-full top-0 left-0 h-1/6 flex items-center px-10'}
                        >
                            <PlaybackButton mediaId={mediaId} mediaType={mediaType} name={mediaName} />
                        </div>
                        <div
                            className={'absolute top-1/2 left-0 w-2/5 h-1/2 flex flex-col justify-center items-start ml-10 gap-y-3'}
                        >
                            <LazyImage
                                src={data.logo ?? ''}
                                alt={data.name}
                                loading={'eager'}
                                className={'max-w-full h-1/3 object-contain'}
                            />
                            <div className={'w-full flex h-1/2 flex-col items-center'}>
                                <span
                                    className={'text-lg ipadPro:text-xl macbook:text-3xl w-full text-left pb-2 line-clamp-2'}
                                >
                                    Upcoming: {data.name}{data.episodeName ? ` - ${data.episodeName}` : ''}
                                </span>
                                <p
                                    className={'text-xs w-full text-left ipadPro:text-sm macbook:text-md line-clamp-4'}
                                >
                                    {data.episodeOverview ?? data.overview}
                                </p>
                                <div
                                    className={'flex items-center py-4 gap-x-4 w-full justify-start'}
                                >
                                    <UpNextPlayButton
                                        videoId={data.videoId}
                                        name={data.name}
                                        playbackId={playbackId}
                                        playlistVideoId={data.playlistVideoId}
                                    />
                                    <InfoButton primary mediaId={data.mediaId} mediaName={data.name} type={data.type} />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            <UpNextWrapper>
                {children}
            </UpNextWrapper>
        </>
    );
}
