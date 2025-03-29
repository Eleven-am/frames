import { IoIosArrowRoundBack } from 'react-icons/io';

import { MediaType, SubtitleSchema } from '@/api/data-contracts';
import { MediaLink } from '@/components/listItem';
import { useSubtitles } from '@/hooks/useSubtitles';
import { tw } from '@/utils/style';


export function Subtitles ({ availableSubtitles }: { availableSubtitles: SubtitleSchema[] }) {
    const { moveUp, subtitle } = useSubtitles(availableSubtitles);

    if (!subtitle) {
        return null;
    }

    return (
        <div
            className={'absolute w-full h-full flex justify-center pointer-events-none'}
        >
            <div
                className={'flex w-3/4 h-1/4 justify-center fixed bottom-0 pointer-events-none'}
            >
                <div
                    data-move-up={moveUp}
                    className={'fullHD:text-2xl text-lg text-lightest pointer-events-none px-2 py-1 bg-darkM/50 rounded-md absolute data-[move-up="true"]:top-0 top-1/2 transform transition-all duration-200 ease-in-out'}
                >
                    <span>
                        {subtitle.text}
                    </span>
                </div>
            </div>
        </div>
    );
}

export function PlaybackButton ({ isNotUpNext = false, mediaId, mediaType, name }: { isNotUpNext?: boolean, mediaId: string, mediaType: MediaType, name: string }) {
    return (
        <MediaLink id={mediaId} type={mediaType} name={name}>
            <IoIosArrowRoundBack
                className={
                    tw('w-20 h-20 fill-light-700 cursor-pointer hover:fill-light-900 hover:scale-110 transition-all duration-300 ease-in', {
                        'fill-lightL hover:fill-lightest': isNotUpNext,
                    })
                }
            />
        </MediaLink>
    );
}
