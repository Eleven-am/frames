import { format } from 'date-fns';
import { motion, MotionValue } from 'framer-motion';

import { DetailedMediaSchema } from '@/api/data-contracts';
import { PlayButton, TrailerButton } from '@/components/framesButtons';
import { SVGSeparator } from '@/components/HorizontalMediaDetials';
import { LazyImage } from '@/components/lazyImage';
import { MediaLinkDiv } from '@/components/listItem';
import { createStyles } from '@/utils/colour';

interface MobileBannerProps {
    media: DetailedMediaSchema & { isInList: boolean };
    opacity: MotionValue<number>;
    height: MotionValue<string>;
    isCurrent: boolean;
}

export function MobileBanner ({ media, height, opacity, isCurrent }: MobileBannerProps) {
    return (
        <MediaLinkDiv
            name={media.name}
            mediaId={media.id}
            mediaType={media.type}
            style={createStyles(media.backdropBlur)}
            className={'cursor-pointer w-full h-full relative shadow-black shadow-md rounded-b-lg overflow-hidden text-light-900 fill-light-900 stroke-light-900 text-shadow-sm stroke-1'}
        >
            <motion.img
                className={'w-full h-full object-cover'}
                src={media.backdrop}
                alt={media.name}
                style={
                    {
                        height,
                    }
                }
            />
            <div
                className={'w-full h-full absolute top-0 left-0 bg-gradient-to-t from-darkD/90 to-transparent pointer-events-none'}
            />
            <motion.div
                className={'w-full h-1/2 absolute bottom-0 mb-4 flex flex-col justify-center items-center gap-y-4'}
                style={
                    {
                        opacity: isCurrent ? opacity : 1,
                    }
                }
            >
                <LazyImage
                    className={'w-3/5 h-1/3 object-contain mx-4'}
                    loading={'eager'}
                    src={media.logo!}
                    alt={media.name}
                />
                <div
                    className={'text-xs flex flex-row justify-center items-center text-light-900 fill-light-900 stroke-light-900 shadow-dark-700 text-shadow-sm stroke-1'}
                >
                    <span className={'rounded-md mr-3 px-2 border'}>
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
                            {format(new Date(media.releaseDate), 'yyyy')}
                        </span>
                    }
                </div>
                <div className={'w-4/5 flex flex-row justify-center items-center gap-x-4 text-shadow-none'}>
                    <PlayButton type={media.type} name={media.name} mediaId={media.id} />
                    <TrailerButton trailer={media.trailer} />
                </div>
                <div className={'w-11/12 flex flex-row mt-2 text-sm items-center mb-10'}>
                    <p className={'line-clamp-2 text-light-900 shadow-dark-700'}>
                        {media.overview}
                    </p>
                </div>
            </motion.div>
        </MediaLinkDiv>
    );
}
