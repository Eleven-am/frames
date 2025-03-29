import { MediaType } from '@/api/data-contracts';
import { LazyImage } from '@/components/lazyImage';
import { PlaybackButton } from '@/components/watch/subtitles';
import { usePlayerUI } from '@/providers/watched/playerUI';

interface TopUIProps {
    name: string;
    episodeName: string | null;
    logo: string | null;
    mediaId: string;
    type: MediaType;
}

export function TopUI ({ name, episodeName, logo, mediaId, type }: TopUIProps) {
    const blocked = usePlayerUI((state) => state.playbackBlocked);

    return (
        <div
            className={'absolute w-full top-0 left-0 h-1/6 flex items-center px-10 bg-gradient-to-b from-darkD/80 to-transparent'}
        >
            {!blocked && <PlaybackButton isNotUpNext mediaId={mediaId} mediaType={type} name={name} />}
            <div className={'absolute w-[30%] h-3/5 flex flex-col items-end justify-center right-0 px-10 m-4 text-lightest'}>
                {
                    logo
                        ? <LazyImage
                            src={logo}
                            alt={name}
                            loading={'eager'}
                            className={'h-4/5 w-auto object-contain'}
                        /> :
                        <span
                            className={'text-5xl font-bold line-clamp-1'}
                        >
                            {name}
                        </span>
                }
                {
                    episodeName &&
                    <span
                        className={'m-2 text-shadow-md'}
                    >
                        {episodeName}
                    </span>
                }
            </div>
        </div>
    );
}
