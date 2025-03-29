import { useCallback, useMemo, useState } from 'react';

import { SeasonResponseSchema, VideoSeen } from '@/api/data-contracts';
import { PrimaryButton } from '@/components/button';
import { ImageList, ImageListType } from '@/components/imageList';
import { Dropdown, ItemProps } from '@/components/select';


interface SeasonDetailsProps {
    videosSeen: VideoSeen[];
    seasons: SeasonResponseSchema[];
}

interface DropdownDetailsProps {
    value: ItemProps<SeasonResponseSchema>;
    options: ItemProps<SeasonResponseSchema>[];
    onChange: (value: SeasonResponseSchema) => void;
}

function DropDownDetails (props: DropdownDetailsProps) {
    if (props.options.length > 1) {
        return (
            <div className={'relative flex items-center justify-start w-full mt-4 px-5 ipadMini:px-10'}>
                <Dropdown
                    value={props.value}
                    options={props.options}
                    onChange={props.onChange}
                />
            </div>
        );
    }

    return (
        <>
            <div className={'relative w-full text-xl px-6 pt-2 ipadMini:hidden'}>
                {props.value.value.season === 0 ? 'Specials' : props.value.value.season === 1 ? 'Episodes' : props.value.label}
            </div>
            <div className={'relative hidden items-center justify-start w-full mt-4 px-10 ipadMini:flex'}>
                <PrimaryButton
                    disabled
                    label={props.value.label}
                />
            </div>
        </>
    );
}

export function SeasonDetails ({ seasons, videosSeen }: SeasonDetailsProps) {
    const seasonOptions = useMemo(() => seasons.map((season) => ({
        value: season,
        label: `Season ${season.season}`,
    })), [seasons]);

    const [season, setSeason] = useState(seasonOptions[0]);

    const visibleEpisodes = useMemo(() => season.value
        .episodes.map((episode) => {
            const seen = videosSeen.find((video) => video.videoId === episode.videoId);

            return {
                ...episode,
                percentage: seen?.percentage || 0,
            };
        }), [season, videosSeen]);

    const handleSeasonChange = useCallback((season: SeasonResponseSchema) => {
        setSeason({
            value: season,
            label: `Season ${season.season}`,
        });
    }, []);

    return (
        <>
            <DropDownDetails value={season} options={seasonOptions} onChange={handleSeasonChange} />
            <ImageList type={ImageListType.EpisodeList} data={visibleEpisodes} />
        </>
    );
}
