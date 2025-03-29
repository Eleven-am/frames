import React, { useCallback, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { BsPip, BsPipFill } from 'react-icons/bs';
import { FiMaximize, FiMinimize, FiSettings, FiUsers } from 'react-icons/fi';
import { IoChatbubbleOutline } from 'react-icons/io5';
import { TbPlayerTrackNext } from 'react-icons/tb';

import { UpNextDetailsSchema } from '@/api/data-contracts';
import { HoverElement } from '@/components/hoverElement';
import { NoLinkLargeRecommendation } from '@/components/listItem';
import { PopupPlayerButton, PlayerButton } from '@/components/watch/playerButton';
import { useGroupWatch, useGroupWatchActions } from '@/providers/groupWatch';
import { usePlayerUI, usePlayerUIActions } from '@/providers/watched/playerUI';
import { videoBridge } from '@/providers/watched/videoBridge';
import { useVideoManager, useVideoManagerActions } from '@/providers/watched/videoManager';
import { watchQueries } from '@/queries/watch';
import { tw } from '@/utils/style';


function SettingsButton () {
    const { openSettings } = usePlayerUIActions();

    return (
        <PlayerButton
            onClick={openSettings}
            title={'Settings'}
        >
            <FiSettings className={'w-8 h-8'} />
        </PlayerButton>
    );
}

function ChatButton () {
    const connected = useGroupWatch((state) => state.connected);
    const { toggleChat } = useGroupWatchActions();

    if (!connected) {
        return null;
    }

    return (
        <PlayerButton
            onClick={toggleChat}
            title={'Chat'}
        >
            <IoChatbubbleOutline className={'w-8 h-8'} />
        </PlayerButton>
    );
}

function GroupWatchButton ({ playbackId }: { playbackId: string }) {
    const { createRoomFromPlayback } = useGroupWatchActions();
    const connected = useGroupWatch((state) => state.connected);

    const handleGroupWatch = useCallback(async () => {
        if (!videoBridge.getIsPaused()) {
            videoBridge.playOrPause();
        }

        await createRoomFromPlayback(playbackId);
    }, [createRoomFromPlayback, playbackId]);

    if (connected) {
        return null;
    }

    return (
        <PlayerButton
            onClick={handleGroupWatch}
            title={'Group Watch'}
        >
            <FiUsers className={'w-8 h-8'} />
        </PlayerButton>
    );
}

function PipButton () {
    const pip = useVideoManager((state) => state.pip);
    const { togglePip } = useVideoManagerActions();

    return (
        <PlayerButton
            onClick={togglePip}
            title={pip ? 'Exit Picture-in-Picture' : 'Enter Picture-in-Picture'}
        >
            {
                pip ?
                    <BsPipFill className={'w-8 h-8'} /> :
                    <BsPip className={'w-8 h-8'} />
            }
        </PlayerButton>
    );
}

function NextButton ({ data }: { data: UpNextDetailsSchema | undefined }) {
    const { setHovering } = usePlayerUIActions();

    return (
        <PopupPlayerButton
            to={'/watch'}
            search={
                {
                    playlistVideoId: data?.playlistVideoId ?? undefined,
                    videoId: data?.playlistVideoId ? undefined : data?.videoId,
                }
            }
            onHover={setHovering}
            title={`Play ${data?.name}`}
            Content={<TbPlayerTrackNext className={'w-8 h-8'} />}
        >
            <div
                className={'pointer-events-none space-y-2 px-2 py-4 flex flex-col justify-center items-center bg-backdrop-blur border-2 bg-darkD/60 rounded-xl border-lightest w-[26rem] mb-4'}
            >
                {
                    (data !== undefined) && (
                        <>
                            <NoLinkLargeRecommendation
                                hideLabel
                                logoBlur={data.logoBlur}
                                backdropBlur={data.backdropBlur}
                                logo={data.logo}
                                backdrop={data.episodeBackdrop || data.backdrop}
                                name={data.name}
                                id={data.mediaId}
                                type={data.type}
                            />
                            {
                                data.episodeName && (
                                    <h2 className={'text-md font-bold text-lightest w-full text-left px-2'}>
                                        {data.episodeName}
                                    </h2>
                                )
                            }
                            <p className={'text-sm text-lightest w-full text-left line-clamp-3 px-2'}>
                                {data.episodeOverview ?? data.overview}
                            </p>
                        </>
                    )
                }
            </div>
        </PopupPlayerButton>
    );
}

function FullscreenButton () {
    const fullscreen = usePlayerUI((state) => state.isFullScreen);
    const { toggleFullScreen } = usePlayerUIActions();

    return (
        <PlayerButton
            onClick={toggleFullScreen}
            title={fullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
            {
                fullscreen ?
                    <FiMinimize className={'w-8 h-8'} /> :
                    <FiMaximize className={'w-8 h-8'} />
            }
        </PlayerButton>
    );
}

export function RightControls ({ playbackId }: { playbackId: string }) {
    const [hovered, setHovered] = useState(false);
    const { data } = useQuery(watchQueries.upNext(playbackId));
    const isChatOpen = useGroupWatch((state) => state.isChatOpen);
    const displayRightControls = usePlayerUI((state) => state.displayRightControls);

    return (
        <HoverElement
            element={'div'}
            onHover={setHovered}
            className={
                tw('flex justify-end gap-x-6 items-center w-1/3 fullHD:w-1/5 h-full', {
                    'gap-x-3': isChatOpen,
                })
            }
        >
            {
                (displayRightControls || hovered) && (
                    <>
                        <SettingsButton />
                        <ChatButton />
                        <GroupWatchButton playbackId={playbackId} />
                        <PipButton />
                        <NextButton data={data} />
                        <FullscreenButton />
                    </>
                )
            }
        </HoverElement>
    );
}
