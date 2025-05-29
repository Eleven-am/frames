import { useMemo } from 'react';

import { dedupeBy } from '@eleven-am/fp';

import { MediaResponseSchema, MediaSection, VideoSeen } from '@/api/data-contracts';
import { ImageListType, ImageList } from '@/components/imageList';
import { SeasonDetails } from '@/components/media/seasonDetails';
import { VerticalMediaInformation, Collection } from '@/components/verticalMediaInformation';
import { LinkType } from '@/hooks/useMediaLink';

export function SectionedHorizontalDetails ({ media }: { media: MediaResponseSchema }) {
    const mapped = useMemo(() => ([
        {
            label: 'Writers',
            people: media.writers,
            type: LinkType.PERSON,
        },
        {
            label: 'Producers',
            people: media.producers,
            type: LinkType.PERSON,
        },
        {
            label: 'Directors',
            people: media.directors,
            type: LinkType.PERSON,
        },
        {
            label: 'Companies',
            people: media.companies,
            type: LinkType.COMPANY,
        },
    ]), [media]);

    const notEmpty = mapped.filter(({ people }) => people && people.length > 0);

    if (notEmpty.length === 0) {
        return (
            <div className={'flex flex-col w-1/2'}>
                {media.collection && <Collection content={media.collection} />}
            </div>
        );
    }

    if (notEmpty.length < 3) {
        return (
            <>
                <div className={'flex flex-col w-1/2'}>
                    {media.collection && <Collection content={media.collection} />}
                    <VerticalMediaInformation
                        type={notEmpty[0].type}
                        label={notEmpty[0].label}
                        backdropBlur={media.backdropBlur}
                        people={dedupeBy(notEmpty[0].people as any, notEmpty[0].type === LinkType.COMPANY ? 'id' : 'tmdbId')}
                    />
                </div>
                <div className={'flex flex-col w-1/2'}>
                    {
                        notEmpty[1] && (
                            <VerticalMediaInformation
                                type={notEmpty[1].type}
                                label={notEmpty[1].label}
                                backdropBlur={media.backdropBlur}
                                people={dedupeBy(notEmpty[1].people as any, notEmpty[1].type === LinkType.COMPANY ? 'id' : 'tmdbId')}
                            />
                        )
                    }
                </div>
            </>
        );
    }

    return (
        <>
            <div className={'flex flex-col w-1/2'}>
                {media.collection && <Collection content={media.collection} />}
                {
                    notEmpty.slice(0, 2).map(({ label, people, type }) => (
                        <VerticalMediaInformation
                            key={label}
                            type={type}
                            label={label}
                            backdropBlur={media.backdropBlur}
                            people={dedupeBy(people as any, type === LinkType.COMPANY ? 'id' : 'tmdbId')}
                        />
                    ))
                }
            </div>
            <div className={'flex flex-col w-1/2'}>
                {
                    notEmpty.slice(2).map(({ label, people, type }) => (
                        <VerticalMediaInformation
                            key={label}
                            type={type}
                            label={label}
                            backdropBlur={media.backdropBlur}
                            people={dedupeBy(people as any, type === LinkType.COMPANY ? 'id' : 'tmdbId')}
                        />
                    ))
                }
            </div>
        </>
    );
}

function MobileDetail ({ media, videosSeen, index }: { media: MediaResponseSchema, videosSeen: VideoSeen[], index: number }) {
    if ([MediaSection.Episodes, MediaSection.Seasons].includes(media.sections[index])) {
        return <SeasonDetails seasons={media.seasons} videosSeen={videosSeen} />;
    }

    if ([MediaSection.MoreLikeThis, MediaSection.MostRelevant].includes(media.sections[index])) {
        return (
            <>
                <div className={'relative w-full text-xl px-6 pt-2'}>
                    {media.sections[index]}
                </div>
                <ImageList type={ImageListType.Recommendations} data={media.recommendations} />
            </>
        );
    }

    if (media.sections[index] === MediaSection.Extras) {
        return (
            <>
                <div className={'relative w-full text-xl px-6 pt-2'}>
                    {media.sections[index]}
                </div>
                <ImageList type={ImageListType.ExtraVideos} data={media.extras} />
            </>
        );
    }

    if ([...media.writers, ...media.producers, ...media.directors, ...media.companies].length > 0) {
        return (
            <>
                <div className={'relative w-full text-xl px-6 pt-2'}>
                    {media.sections[index]}
                </div>
                <div className={'flex w-full px-2'}>
                    <SectionedHorizontalDetails media={media} />
                </div>
            </>
        );
    }

    return null;
}

export function MobileDetails ({ media, videosSeen }: { media: MediaResponseSchema, videosSeen: VideoSeen[] }) {
    return (
        <>
            {
                media.sections.map((section, index) => (
                    <MobileDetail media={media} index={index} key={section} videosSeen={videosSeen} />
                ))
            }
        </>
    );
}
