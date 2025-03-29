import { MediaResponseSchema, MediaSection, UserMediaDetailsResponseSchema } from '@/api/data-contracts';
import { AddToList,
    AddToPlaylist,
    GroupWatch,
    MarkAsWatched,
    ModifyMedia,
    PlayButton,
    RateButton,
    ShufflePlay,
    TrailerButton } from '@/components/framesButtons';
import { HorizontalDetails } from '@/components/HorizontalMediaDetials';
import { ImageList, ImageListType } from '@/components/imageList';
import { LazyImage } from '@/components/lazyImage';
import { BackgroundImage } from '@/components/media/mediaInfoBackground';
import { SectionedHorizontalDetails } from '@/components/media/mediaInfoMobileDetails';
import { SeasonDetails } from '@/components/media/seasonDetails';
import { Metadata } from '@/components/metadata';
import { TabsHolder } from '@/components/tabs';
import { VerticalMediaInformation } from '@/components/verticalMediaInformation';
import { LinkType, useMediaLink } from '@/hooks/useMediaLink';
import { dedupeBy } from '@/utils/arrayFunctions';
import { tw } from '@/utils/style';

interface MediaInfoDesktopProps {
    media: MediaResponseSchema;
    details: UserMediaDetailsResponseSchema;
}

function MediaDetails ({ media }: { media: MediaResponseSchema }) {
    return (
        <div className={'relative flex flex-col m-4'}>
            <div className={'flex flex-row'}>
                <div className={'flex flex-col w-7/12 mx-4'}>
                    <h1 className={'text-[4rem] font-bold mb-2'}>{media.name}</h1>
                    <HorizontalDetails
                        className={'flex flex-row my-4 text-md items-center whitespace-nowrap'}
                        media={media}
                    />
                    <p className={'text-xl font-medium mt-2'}>{media.overview}</p>
                </div>
                <div className={'flex w-5/12 mx-4'}>
                    <SectionedHorizontalDetails media={media} />
                </div>
            </div>
            <div className={'my-8 mr-4'}>
                <ImageList type={ImageListType.Cast} data={dedupeBy(media.actors, 'tmdbId')} />
            </div>
        </div>
    );
}

export function MediaInfoDesktop ({ media, details }: MediaInfoDesktopProps) {
    const { link } = useMediaLink({
        id: media.id,
        type: media.type,
        name: media.name,
    });

    return (
        <BackgroundImage
            backdrop={media.backdrop}
            name={media.name}
        >
            <Metadata
                metadata={
                    {
                        name: media.name,
                        overview: media.overview || '',
                        poster: media.poster,
                        link: link.mask.to,
                    }
                }
            />
            <div className={'w-full flex relative'}>
                <div className={'w-4/5 mx-4'}>
                    <div className={'relative w-3/5 min-h-[10rem] max-h-[12rem] flex items-center'}>
                        {
                            media.logo ?
                                <LazyImage
                                    className={'absolute top-0 w-auto h-full object-contain mx-4'}
                                    src={media.logo}
                                    alt={media.name}
                                    loading={'eager'}
                                /> :
                                <h1 className={tw('m-4 font-frames font-bold text-7xl text-shadow-lg line-clamp-1')}>
                                    {media.name}
                                </h1>
                        }
                    </div>
                    <HorizontalDetails
                        className={'w-4/5 flex flex-row m-4 text-md items-center whitespace-nowrap'}
                        media={media}
                    />
                    <div className={'w-4/5 mx-4 text-lg pointer-events-none'}>
                        <p className={'line-clamp-2'}>
                            {media.overview}
                        </p>
                    </div>
                    <div
                        className={'w-4/5 flex flex-row mx-4 my-4 text-md items-center gap-x-4 text-shadow-none fill-light-900 stroke-light-900 stroke-1'}
                    >
                        <PlayButton
                            type={media.type}
                            name={media.name}
                            mediaId={media.id}
                        />
                        <TrailerButton trailer={media.trailer} />
                        <ShufflePlay
                            type={media.type}
                            mediaName={media.name}
                            mediaId={media.id}
                        />
                        <GroupWatch mediaId={media.id} />
                        <AddToList mediaId={media.id} data={details} />
                        <AddToPlaylist mediaId={media.id} mediaName={media.name} backdropBlur={media.backdropBlur} />
                        <MarkAsWatched mediaId={media.id} data={details.seen} />
                        <RateButton
                            mediaId={media.id}
                            mediaName={media.name}
                            data={
                                {
                                    id: media.id,
                                    status: details.rating,
                                }
                            }
                        />
                        <ModifyMedia mediaName={media.name} hide={!details.canModify} mediaId={media.id} backdropBlur={media.backdropBlur} />
                    </div>
                </div>
                <div className={'w-1/5 right-0 mt-12'}>
                    <VerticalMediaInformation
                        label={'Cast'}
                        type={LinkType.PERSON}
                        backdropBlur={media.backdropBlur}
                        people={
                            dedupeBy(media.actors, 'tmdbId')
                                .slice(0, 5)
                        }
                    />
                    <VerticalMediaInformation
                        label={'Directors'}
                        type={LinkType.PERSON}
                        backdropBlur={media.backdropBlur}
                        people={
                            dedupeBy(media.directors, 'tmdbId')
                                .slice(0, 3)
                        }
                    />
                </div>
            </div>
            <TabsHolder
                tabs={media.sections}
                ulClassName={'gap-x-4'}
                key={`tmdb-${media.tmdbId}-type-${media.type}-id-${media.id}`}
                underlineClassName={'h-1 bg-white'}
                holderClassName={'mx-8 border-b-2 border-white/40 text-light-500/70 mt-4'}
                liClassName={'font-medium text-2xl p-3 transition-all duration-300 hover:text-white/70'}
                activeLiClassName={'text-white hover:text-white/80'}
                components={
                    [
                        {
                            activeWhen: [MediaSection.MoreLikeThis],
                            component: <ImageList type={ImageListType.Recommendations} data={media.recommendations} />,
                        },
                        {
                            activeWhen: [MediaSection.Extras],
                            component: <ImageList type={ImageListType.ExtraVideos} data={media.extras} />,
                        },
                        {
                            activeWhen: [MediaSection.Seasons, MediaSection.Episodes],
                            component: <SeasonDetails seasons={media.seasons} videosSeen={details.seen.videosSeen} />,
                        },
                        {
                            activeWhen: [MediaSection.Details],
                            component: <MediaDetails media={media} />,
                        },
                    ]
                }
            />
        </BackgroundImage>
    );
}

