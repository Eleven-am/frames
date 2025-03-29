import { SearchedMediaSchema, SearchedVideoSchema } from '@/api/data-contracts';
import { PrimaryButton, RoundedButton } from '@/components/button';
import { BaseInput } from '@/components/input';
import { LazyImage } from '@/components/lazyImage';
import { NoLinkLargeRecommendation } from '@/components/listItem';
import { Modal } from '@/components/modal';
import { Dropdown } from '@/components/select';
import { usePlaylistContext } from '@/contexts/playlist';
import { playlistInfiniteQueries } from '@/queries/playlist';
import { dedupeBy, sortBy } from '@/utils/arrayFunctions';
import { createStyles } from '@/utils/colour';
import { useInfiniteScroll } from '@eleven-am/xquery';
import { useCallback, useMemo, useState } from 'react';

import { FiSearch } from 'react-icons/fi';
import { IoAddOutline, IoCloseOutline } from 'react-icons/io5';


export function PlaylistAddModal () {
    const { addVideo, toggleModal, setVideos, isModalOpen } = usePlaylistContext();
    const [search, setSearch] = useState('');
    const [show, setShow] = useState<SearchedMediaSchema | null>(null);

    const seasons = useMemo(() => sortBy(dedupeBy(show?.videos ?? [], 'season'), 'season', 'asc')
        .map((v) => ({
            value: v,
            label: `Season ${v.season}`,
        })),
    [show]);

    const [season, setSeason] = useState(seasons[0]?.value.season ?? 1);

    const episodes = useMemo(() => sortBy((show?.videos ?? []).filter((v) => v.season === season), 'episode', 'asc')
        .map((v) => ({
            value: v,
            label: `Episode ${v.episode}`,
        })),
    [season, show]);

    const [episode, setEpisode] = useState(episodes[0]?.value ?? 1);

    const activeSeason = useMemo(() => seasons.find((s) => s.value.season === season) ?? {
        label: 'Select a season',
        value: seasons[0]?.value ?? null,
    }, [season, seasons]);

    const activeEpisode = useMemo(() => episodes.find((e) => e.value.episode === episode.episode) ?? {
        label: 'Select an episode',
        value: episodes[0]?.value ?? null,
    }, [episode, episodes]);

    const handleChangeSeason = useCallback((value: SearchedVideoSchema) => {
        if (value.season) {
            setSeason(value.season);
        }
    }, []);

    const handleChangeEpisode = useCallback((value: SearchedVideoSchema) => {
        if (value.episode) {
            setEpisode(value);
        }
    }, []);

    const handleAddMedia = useCallback((media: SearchedMediaSchema) => () => {
        if (media.videos.length === 1) {
            addVideo(media.videos[0]);
        } else {
            setShow(media);
        }
    }, [addVideo]);

    const clearShow = useCallback(() => setShow(null), []);

    const handleAddEpisode = useCallback(() => {
        if (activeEpisode.value) {
            addVideo(activeEpisode.value);
        }
    }, [activeEpisode.value, addVideo]);

    const handleAddEntireShow = useCallback(() => {
        const videos = sortBy(show?.videos ?? [], ['season', 'episode'], ['asc', 'asc']);

        setVideos(videos);
    }, [setVideos, show?.videos]);

    const [items, ref] = useInfiniteScroll(playlistInfiniteQueries.searchPlaylists(search));

    const handleClosing = useCallback(() => {
        toggleModal();
        setSearch('');
        setShow(null);
    }, [toggleModal]);

    return (
        <>
            <Modal
                open={isModalOpen}
                onClose={handleClosing}
                className={'flex flex-col items-center justify-start w-10/12 h-4/5 px-4 py-8 space-y-4 bg-darkD/60 backdrop-blur-lg rounded-xl border-2 border-lightest shadow-black shadow-lg'}
            >
                <BaseInput
                    onChange={setSearch}
                    className={'flex font-medium bg-transparent w-64 ipadPro:w-96 h-10 py-1 mr-2 text-lightest text-md border-none ring-0 focus:outline-none focus:ring-0 focus:border-lightest/100 placeholder-lightest/60'}
                    holderClassName={'group flex items-center h-10 text-lightest text-lg font-medium border-2 rounded-xl px-2 ipadMini:mr-2 cursor-pointer border-lightest transition-all duration-300 ease-in-out'}
                    placeholder="search for videos"
                    iconPosition={'right'}
                    icon={<FiSearch className={'w-6 h-6'} />}
                    value={search}
                    type={'text'}
                />
                <div
                    className={'grid grid-cols-1 ipadMini:grid-cols-2 ipadPro:grid-cols-3 fullHD:grid-cols-4 gap-4 max-w-full max-h-full overflow-y-scroll scrollbar-hide border-t-2 border-lightest/5 py-8'}
                >
                    {
                        items.map((media) => (
                            <div key={media.id} onClick={handleAddMedia(media)}>
                                <NoLinkLargeRecommendation
                                    logoBlur={media.logoBlur}
                                    backdropBlur={media.backdropBlur}
                                    logo={media.logo}
                                    backdrop={media.backdrop}
                                    name={media.name}
                                    id={media.id}
                                    type={media.type}
                                />
                            </div>
                        ))
                    }
                    <div ref={ref} className={'w-full h-1'} />
                </div>
            </Modal>
            <Modal
                open={Boolean(show)}
                onClose={clearShow}
                style={createStyles(show?.backdropBlur ?? '255, 255, 255,')}
                className={'relative border-2 border-lightest w-3/5 h-3/5 bg-darkD/60 backdrop-blur-lg rounded-xl shadow-black shadow-lg flex flex-col items-center justify-start text-lightest/60'}
            >
                <LazyImage
                    className={'absolute w-full h-full object-cover top-0 left-0 opacity-20'}
                    src={show?.backdrop ?? ''}
                    alt={show?.name ?? ''}
                />
                <div className={'w-full py-4 flex items-center justify-center border-b-2 border-lightest/5'}>
                    <h1 className={'text-lightest text-2xl font-medium'}>
                        {show?.name}
                    </h1>
                    <RoundedButton
                        title={'Close'}
                        onClick={clearShow}
                        className={'absolute right-0 mx-4 my-2'}
                    >
                        <IoCloseOutline className={'w-6 h-6'} />
                    </RoundedButton>
                </div>
                <div className={'relative w-4/5 h-4/5 py-4 flex items-center justify-around gap-x-4'}>
                    <div className={'relative flex h-full flex-col items-center justify-center ml-4 gap-y-4'}>
                        <LazyImage
                            className={'w-auto mt-2 h-[60%] object-cover aspect-[2/3] rounded-lg shadow-black shadow-sm'}
                            src={show?.portrait ?? ''}
                            alt={show?.name ?? ''}
                        />
                        <PrimaryButton
                            label={'Add entire show'}
                            title={'Add entire show'}
                            onClick={handleAddEntireShow}
                        >
                            <IoAddOutline className={'w-6 h-6'} />
                        </PrimaryButton>
                    </div>
                    <div
                        className={'flex flex-col h-full items-center justify-center gap-y-4 px-4 border border-lightest/5 rounded-md'}
                    >
                        <div className={'flex w-full items-center justify-center gap-x-4'}>
                            <Dropdown
                                value={activeSeason}
                                options={seasons}
                                onChange={handleChangeSeason}
                            />
                            <Dropdown
                                value={activeEpisode}
                                options={episodes}
                                onChange={handleChangeEpisode}
                            />
                        </div>
                        <PrimaryButton
                            label={'Add episode'}
                            title={'Add episode'}
                            onClick={handleAddEpisode}
                        >
                            <IoAddOutline className={'w-6 h-6'} />
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </>
    );
}
