import { memo } from 'react';

import { format } from 'date-fns';

import { MediaResponseSchema, MediaType } from '@/api/data-contracts';
import { BaseButton } from '@/components/button';
import { tw } from '@/utils/style';


interface HorizontalDetailsProps {
    className?: string;
    media: {
        type: MediaType;
        rating?: string;
        genre?: string;
        genres?: string[];
        releaseDate?: string | null;
        runtime?: string;
        voteAverage?: number;
        backdropBlur: string;
        mediaStatus?: string | null;
    };
}

export const SVGSeparator = memo(({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) => (
    <svg viewBox="0 0 24 24"
        className={
            tw('fill-light-900/70 stroke-light-900/70 stroke-1', {
                'w-3 h-3': size === 'lg',
                'w-2 h-2': size === 'md',
                'w-1 h-1': size === 'sm',
            })
        }
    >
        <circle cx="12" cy="12" r="10" />
    </svg>
));

const Rated = memo(({ rate }: { rate: number | null }) => {
    rate = (rate || 0) / 2;
    const rating = Math.round(rate);
    const fixedRate = rate.toFixed(1);

    return (
        <div className="flex items-center mx-3 fill-light-800/50">
            {
                [...Array(5)].map((_, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <svg key={`star${i}`}
                        className={`w-5 h-5 ${i < rating ? 'text-white/80' : ''}`}
                        aria-hidden
                        fill={`${i < rating ? 'currentColor' : ''}`}
                        viewBox={'0 0 20 20'}
                    >
                        <path
                            d={'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'}
                        />
                    </svg>
                ))
            }
            <p className="ml-2 text-xs ipadMini:text-sm whitespace-nowrap">{fixedRate} out of 5</p>
        </div>
    );
});

export const HorizontalDetails = memo((props: HorizontalDetailsProps) => {
    const { media, className } = props;

    return (
        <div className={className}>
            {
                media.rating && (
                    <span className={'border rounded-md mr-3 px-2'}>
                        {media.rating}
                    </span>
                )
            }
            {
                media.genre !== undefined && (
                    <>
                        <SVGSeparator />
                        <BaseButton
                            className={'hover:text-light-200'}
                            title={'Search by genre'}
                            to={media.type === MediaType.MOVIE ? '/movies' : '/shows'}
                            search={
                                {
                                    genres: media.genres,
                                    decade: 0,
                                }
                            }
                        >
                            <span className={'mx-3'}>
                                {media.genre}
                            </span>
                        </BaseButton>
                    </>
                )
            }
            {
                Boolean(media.releaseDate) && (
                    <>
                        <SVGSeparator />
                        {
                            media.releaseDate &&
                            <BaseButton
                                className={'hover:text-light-200'}
                                title={'Search by year'}
                                to={media.type === MediaType.MOVIE ? '/movies' : '/shows'}
                                search={
                                    {
                                        genres: [],
                                        decade: Math.floor((new Date(media.releaseDate).getFullYear()) / 10) * 10,
                                    }
                                }
                            >
                                <span className={'mx-3'}>
                                    {
                                        media.mediaStatus ?
                                            media.mediaStatus :
                                            format(new Date(media.releaseDate), 'MMM yyyy')
                                    }
                                </span>
                            </BaseButton>
                        }
                    </>
                )
            }
            {
                media.runtime !== undefined && (
                    <>
                        <SVGSeparator />
                        <span className={'mx-3'}>
                            {media.runtime}
                        </span>
                    </>
                )
            }
            {
                media.voteAverage !== undefined && (
                    <>
                        <SVGSeparator />
                        <Rated rate={media.voteAverage} />
                    </>
                )
            }
        </div>
    );
});

export const HorizontalMobileDetails = memo((props: { media: MediaResponseSchema, className?: string }) => {
    const { media, className } = props;

    return (
        <div className={className}>
            <span className={'border rounded-md mr-3 px-2 text-white'}>
                {media.rating}
            </span>
            <SVGSeparator size={'sm'} />
            <span className={'mx-2'}>
                {media.genre}
            </span>
            <SVGSeparator size={'sm'} />
            {
                media.releaseDate &&
                <span className={'mx-3'}>
                    {
                        media.mediaStatus ?
                            media.mediaStatus :
                            format(new Date(media.releaseDate), 'yyyy')
                    }
                </span>
            }
            <SVGSeparator size={'sm'} />
            <span className={'mx-2'}>
                {media.runtime}
            </span>
        </div>
    );
});
