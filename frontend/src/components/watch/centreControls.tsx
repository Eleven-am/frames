import { useCallback } from 'react';

import { FiPlayCircle, FiPauseCircle } from 'react-icons/fi';

import { PlayerButton } from '@/components/watch/playerButton';
import { usePlaybackState } from '@/providers/watched/playerPageStates';
import { videoBridge } from '@/providers/watched/videoBridge';


function RewindButton () {
    const rewind = useCallback(() => {
        videoBridge.seekFromCurrent(-10);
    }, []);

    return (
        <PlayerButton
            onClick={rewind}
            title="Rewind"
        >
            <svg
                viewBox="0 0 24 24"
                className={'w-10 h-10 fill-current'}
            >
                <path
                    d="M12.5,3C17.15,3 21.08,6.03 22.47,10.22L20.1,11C19.05,7.81 16.04,5.5 12.5,5.5C10.54,5.5 8.77,6.22 7.38,7.38L10,10H3V3L5.6,5.6C7.45,4 9.85,3 12.5,3M10,12V22H8V14H6V12H10M18,14V20C18,21.11 17.11,22 16,22H14A2,2 0 0,1 12,20V14A2,2 0 0,1 14,12H16C17.11,12 18,12.9 18,14M14,14V20H16V14H14Z"
                />
            </svg>
        </PlayerButton>
    );
}

function ForwardButton () {
    const forward = useCallback(() => {
        videoBridge.seekFromCurrent(10);
    }, []);

    return (
        <PlayerButton
            onClick={forward}
            title="Forward"
        >
            <svg
                viewBox="0 0 24 24"
                className={'w-10 h-10 fill-current'}
            >
                <path
                    d="M10,12V22H8V14H6V12H10M18,14V20C18,21.11 17.11,22 16,22H14A2,2 0 0,1 12,20V14A2,2 0 0,1 14,12H16C17.11,12 18,12.9 18,14M14,14V20H16V14H14M11.5,3C14.15,3 16.55,4 18.4,5.6L21,3V10H14L16.62,7.38C15.23,6.22 13.46,5.5 11.5,5.5C7.96,5.5 4.95,7.81 3.9,11L1.53,10.22C2.92,6.03 6.85,3 11.5,3Z"
                />
            </svg>
        </PlayerButton>
    );
}

function PlayPauseButton () {
    const playing = usePlaybackState((state) => state.playing);
    const playPause = useCallback(() => videoBridge.playOrPause(), []);

    return (
        <PlayerButton
            onClick={playPause}
            title={playing ? 'Pause' : 'Play'}
        >
            {
                playing ?
                    <FiPauseCircle className={'w-20 h-20'} strokeWidth={1} /> :
                    <FiPlayCircle className={'w-20 h-20'} strokeWidth={1.2} />
            }
        </PlayerButton>
    );
}

export function CentreControls () {
    return (
        <div
            className={'flex justify-center items-center gap-x-3 flex-grow h-full'}
        >
            <RewindButton />
            <PlayPauseButton />
            <ForwardButton />
        </div>
    );
}
