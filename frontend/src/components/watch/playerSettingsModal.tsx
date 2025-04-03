import { FaMinus } from 'react-icons/fa6';
import { LuPlus } from 'react-icons/lu';

import { SubtitleSchema } from '@/api/data-contracts';
import { BaseButton } from '@/components/button';
import { Modal } from '@/components/modal';
import { FramesSelect } from '@/components/select';
import { BaseSection } from '@/components/settingsUI/baseSections';
import { Slider } from '@/components/slider';
import { Switch } from '@/components/switch';
import { usePlayerSettings } from '@/hooks/usePlayerSettings';


interface PlayerSettingsModalProps {
    availableSubtitles: SubtitleSchema[];
    playbackId: string;
    canAccessStream: boolean;
}

export function PlayerSettingsModal ({ availableSubtitles, playbackId, canAccessStream }: PlayerSettingsModalProps) {
    const {
        incognito, setIncognito,
        inform, handleInformChange,
        settingsOpen, closeSettings,
        handleSyncTimeChange, syncTime,
        autoPlay, handleAutoPlayChange,
        rate, handlePlaybackSpeedChange,
        subtitle, displayedSubtitle, languages,
        activeSubtitle, handleActiveSubtitleChange,
    } = usePlayerSettings(availableSubtitles, playbackId, canAccessStream);

    return (
        <Modal
            open={settingsOpen}
            onClose={closeSettings}
            className={'flex flex-col items-center justify-start overflow-hidden overflow-y-scroll scrollbar-hide gap-y-6 py-4 w-1/3 fullHD:w-1/3 h-2/3 px-4 bg-darkD/60 backdrop-blur-lg rounded-xl border-2 border-lightest shadow-black shadow-lg'}
        >
            <BaseSection
                label={'Playback Settings'}
                description={'Enabling the auto play setting will automatically play the next suggested video in the queue. When inform is enabled, frames would save the user\'s progress for the current video.'}
                settings={
                    [
                        {
                            label: 'Auto Play',
                            rightElement: <Switch isSelected={autoPlay} onChange={handleAutoPlayChange} />,
                        },
                        {
                            label: 'Inform',
                            rightElement: <Switch isSelected={inform} onChange={handleInformChange} />,
                        },
                        {
                            label: 'Playback Speed',
                            rightElement: (
                                <div className={'w-40 flex gap-x-2'}>
                                    <Slider
                                        max={2}
                                        min={0.5}
                                        size={8}
                                        fill={'#90C5F0'}
                                        current={rate}
                                        empty={'rgba(144, 197, 240, 0.2)'}
                                        handleChange={handlePlaybackSpeedChange}
                                    />
                                    <span className={'text-lightest text-xs'}>
                                        {rate.toFixed(1)}x
                                    </span>
                                </div>
                            ),
                        },
                    ]
                }
            />
            <BaseSection
                description={'Enabling incognito will make you invisible to other users currently on frames. This makes it impossible for users to add you to their group watch sessions. You would be unable to see other users or create group watch sessions.'}
                settings={
                    [
                        {
                            label: 'Incognito Mode',
                            rightElement: <Switch isSelected={incognito} onChange={setIncognito} />,
                        },
                    ]
                }
            />
            <BaseSection
                description={'Choose the language of the subtitles to display. This subtitle will be displayed for all videos that have subtitles available.'}
                settings={
                    [
                        {
                            label: 'Subtitles',
                            rightElement: (
                                <FramesSelect
                                    onChange={handleActiveSubtitleChange}
                                    value={activeSubtitle}
                                    options={languages}
                                />
                            ),
                        },
                        {
                            label: 'Sync Time',
                            rightElement: (
                                <div className={'flex gap-x-4 items-center'}>
                                    <BaseButton
                                        title={'Decrease Sync Time'}
                                        onClick={handleSyncTimeChange.bind(null, -500)}
                                        className={'w-6 h-6 rounded-full bg-darkD/40 flex items-center justify-center'}
                                    >
                                        <FaMinus className={'text-lightest'} />
                                    </BaseButton>
                                    <span className={'text-lightest'}>
                                        {syncTime} ms
                                    </span>
                                    <BaseButton
                                        title={'Increase Sync Time'}
                                        onClick={handleSyncTimeChange.bind(null, 500)}
                                        className={'w-6 h-6 rounded-full bg-darkD/40 flex items-center justify-center'}
                                    >
                                        <LuPlus className={'text-lightest'} />
                                    </BaseButton>
                                </div>
                            ),
                        },
                    ]
                }
            />
            {
                subtitle && displayedSubtitle && (
                    <div className={'text-lg text-lightest pointer-events-none px-2 py-1 bg-darkM/50 rounded-md'}>
                        <span>
                            {subtitle.text}
                        </span>
                    </div>
                )
            }
        </Modal>
    );
}
