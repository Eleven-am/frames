import { useMemo } from 'react';

import { dedupeBy } from '@eleven-am/fp';

import { MediaResponseSchema, UserMediaDetailsResponseSchema } from '@/api/data-contracts';
import { AddToList,
    AddToPlaylist,
    GroupWatch,
    MarkAsWatched,
    PlayButton,
    RateButton,
    ShufflePlay,
    TrailerButton } from '@/components/framesButtons';
import { HorizontalMobileDetails } from '@/components/HorizontalMediaDetials';
import { ImageList, ImageListType } from '@/components/imageList';
import { LazyImage } from '@/components/lazyImage';
import { BackgroundImageMobile } from '@/components/media/mediaInfoBackground';
import { MobileDetails } from '@/components/media/mediaInfoMobileDetails';

interface MediaInfoMobileProps {
    media: MediaResponseSchema;
    details: UserMediaDetailsResponseSchema;
}

export function MediaMobile ({ media, details }: MediaInfoMobileProps) {
    const filteredActors = useMemo(() => dedupeBy(media.actors, 'tmdbId')
        .filter((actors) => Boolean(actors.character)), [media.actors]);

    return (
        <div className={'relative visible ipadMini:hidden w-full h-screen scrollbar-hide bg-dark-800'}>
            <BackgroundImageMobile backdrop={media.backdrop} />
            <div
                className={'-mt-44 w-full bg-dark-800 overflow-y-scroll scrollbar-hide flex flex-col items-center text-shadow-sm shadow-dark-700 text-light-900'}
            >
                <div className={'relative container min-h-[8rem] max-h-[12rem] flex items-center justify-center'}>
                    {
                        media.logo ?
                            <LazyImage className={'absolute w-4/5 top-0 h-full object-contain'}
                                src={media.logo}
                                alt={media.name}
                                loading={'eager'}
                            /> :
                            <span className={'mx-4 mt-8 font-bold text-3xl line-clamp-1 font-frames'}>
                                {media.name}
                            </span>
                    }
                </div>
                <div className={'gap-y-4 my-4 flex flex-col items-center w-full'}>
                    <HorizontalMobileDetails
                        className={'relative container text-white/50 flex flex-row text-xs items-center justify-center whitespace-nowrap'}
                        media={media}
                    />
                    <div className={'w-full flex justify-center'}>
                        <div className={'flex flex-row gap-x-4'}>
                            <PlayButton type={media.type} name={media.name} mediaId={media.id} />
                            <TrailerButton trailer={media.trailer} />
                        </div>
                    </div>
                    <div className={'w-full flex justify-center'}>
                        <div className={'flex flex-row gap-x-2'}>
                            <ShufflePlay
                                mediaId={media.id}
                                mediaName={media.name}
                                type={media.type}
                            />
                            <GroupWatch mediaId={media.id} />
                            <AddToList
                                mediaId={media.id}
                                data={details}
                            />
                            <AddToPlaylist mediaId={media.id} mediaName={media.name} backdropBlur={media.backdropBlur} />
                            <MarkAsWatched
                                mediaId={media.id}
                                data={details.seen}
                            />
                            <RateButton
                                data={
                                    {
                                        status: details.rating,
                                        id: media.id,
                                    }
                                }
                                mediaId={media.id}
                                mediaName={media.name}
                            />
                        </div>
                    </div>
                    <p className={'relative w-full px-4 text-sm'}>
                        {media.overview}
                    </p>
                </div>
                <MobileDetails media={media} videosSeen={details.seen.videosSeen} />
                {
                    filteredActors.length > 0 && (
                        <div className={'relative w-full text-xl px-6 pt-2'}>
                            Cast
                        </div>
                    )
                }
                <ImageList type={ImageListType.Cast} data={media.actors} />
            </div>
        </div>
    );
}
