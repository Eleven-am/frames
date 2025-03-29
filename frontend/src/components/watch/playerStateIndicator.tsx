import { useCallback } from 'react';

import { BsPauseFill } from 'react-icons/bs';
import { FaPlay } from 'react-icons/fa';

import { usePlaybackState } from '@/providers/watched/playerPageStates';
import { videoBridge } from '@/providers/watched/videoBridge';

export function PlayerStateIndicator () {
    const { playing, display } = usePlaybackState();
    const playPause = useCallback(() => videoBridge.playOrPause(), []);

    return (
        <div
            onClick={playPause}
            className={'absolute top-0 left-0 w-full h-full flex justify-center items-center'}
        >
            {
                display
                    ? (
                        <FaPlay className={'w-32 h-32 text-lightM/80 cursor-pointer'} />
                    )
                    : !playing
                        ? (
                            <BsPauseFill className={'w-32 h-32 text-lightM/80 animate-flash'} />
                        )
                        : (
                            <FaPlay className={'w-32 h-32 text-lightM/80 animate-flash'} />
                        )
            }
        </div>
    );
}
