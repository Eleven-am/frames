import { useState, useCallback, useMemo, MouseEvent } from 'react';

import { sortBy } from '@eleven-am/fp';
import { useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { FaCheck } from 'react-icons/fa6';
import { FiThumbsUp, FiThumbsDown, FiHeart } from 'react-icons/fi';
import { IoMdMore } from 'react-icons/io';
import { IoClose } from 'react-icons/io5';
import { LuEye, LuEyeOff } from 'react-icons/lu';
import { PiQueue } from 'react-icons/pi';

import { HistoryType, HistorySchema, RatedStatus } from '@/api/data-contracts';
import { DropDownButton, DropdownMenu, DropdownContent, BaseButton } from '@/components/button';
import { Checkbox } from '@/components/checkbox';
import { List } from '@/components/gridList';
import { BaseInput } from '@/components/input';
import { LazyImage } from '@/components/lazyImage';
import { MediaLinkDiv } from '@/components/listItem';
import { DisplayLoader } from '@/components/loading-set/Loading';
import { PlaylistSettings } from '@/components/playlistSettings';
import { Segment } from '@/components/settingsUI/segments';
import { useRefreshTime, RefreshTimeProvider } from '@/contexts/refreshTime';
import { useModalHook } from '@/hooks/useModalHook';
import { activityInfiniteQueries, activityMutations } from '@/queries/settings/activity';
import { createStyles } from '@/utils/colour';
import { tw } from '@/utils/style';

interface HistoryItemProps {
    history: HistorySchema;
    selected: boolean;
    isLastItem: boolean;
    onSelect: (history: HistorySchema) => void;
}

interface MoreItemButtonProps {
    history: HistorySchema;
}

interface FilterButtonProps {
    selected: HistoryType[];
    toggle: (type: HistoryType) => void;
}

interface DeleteButtonProps {
    selected: string[];
    setSelect: (selected: string[]) => void;
}

function FilterButton ({ selected, toggle }: FilterButtonProps) {
    const elements = useMemo((): DropdownContent[] => [
        {
            key: 'watched',
            active: selected.includes(HistoryType.Watched),
            onClick: () => toggle(HistoryType.Watched),
            Component: (
                <>
                    <LuEye className="mr-2 h-4 w-4" />
                    <span className={'ml-3'}>watched</span>
                </>
            ),
        },
        {
            key: 'liked',
            active: selected.includes(HistoryType.RatedPositive),
            onClick: () => toggle(HistoryType.RatedPositive),
            Component: (
                <>
                    <FiThumbsUp className="mr-2 h-4 w-4" />
                    <span className={'ml-3'}>liked</span>
                </>
            ),
        },
        {
            key: 'disliked',
            active: selected.includes(HistoryType.RatedNegative),
            onClick: () => toggle(HistoryType.RatedNegative),
            Component: (
                <>
                    <FiThumbsDown className="mr-2 h-4 w-4" />
                    <span className={'ml-3'}>disliked</span>
                </>
            ),
        },
        {
            key: 'watchlist',
            active: selected.includes(HistoryType.AddedToWatchlist),
            onClick: () => toggle(HistoryType.AddedToWatchlist),
            Component: (
                <>
                    <FaCheck className="mr-2 h-4 w-4" />
                    <span className={'ml-3'}>added to watchlist</span>
                </>
            ),
        },
    ], [selected, toggle]);

    return (
        <DropDownButton
            className={'h-8 text-white/80 py-1 px-4 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out shadow-black shadow-sm hover:text-white hover:shadow-md hover:shadow-black bg-darkD/70 hover:bg-darkM/70'}
            Content={<span>filter</span>}
        >
            <DropdownMenu
                title={'filter by'}
                elements={elements}
            />
        </DropDownButton>
    );
}

function HistoryMoreButton ({ history }: MoreItemButtonProps) {
    const { updateRefreshTime } = useRefreshTime();
    const { isOpen, openModal, closeModal } = useModalHook();
    const { mutate: rateMedia } = useMutation(activityMutations.rateMedia(history.media.id, updateRefreshTime));
    const { mutate: watchList } = useMutation(activityMutations.watchList(history.media.id, updateRefreshTime));
    const { mutate: seenMedia } = useMutation(activityMutations.seenMedia(history.media.id, updateRefreshTime));
    const { mutate: seenVideo } = useMutation(activityMutations.seenVideo(history.media.videoId, updateRefreshTime));

    const elements = useMemo(() => [
        {
            key: 'liked',
            type: HistoryType.RatedPositive,
            onClick: () => rateMedia(RatedStatus.POSITIVE),
            Component: (
                <>
                    <FiThumbsUp className="mr-2 h-4 w-4" />
                    <span className={'ml-3'}>rate positive</span>
                </>
            ),
        },
        {
            key: 'disliked',
            type: HistoryType.RatedNegative,
            onClick: () => rateMedia(RatedStatus.NEGATIVE),
            Component: (
                <>
                    <FiThumbsDown className="mr-2 h-4 w-4" />
                    <span className={'ml-3'}>rate negative</span>
                </>
            ),
        },
        {
            type: null,
            key: 'non-rated',
            onClick: () => rateMedia(RatedStatus.NONE),
            Component: (
                <>
                    <FiHeart className="mr-2 h-4 w-4" />
                    <span className={'ml-3'}>remove rating</span>
                </>
            ),
        },
        {
            key: 'add-watchlist',
            type: HistoryType.AddedToWatchlist,
            onClick: () => watchList(true),
            Component: (
                <>
                    <FaCheck className="mr-2 h-4 w-4" />
                    <span className={'ml-3'}>add to watchlist</span>
                </>
            ),
        },
        {
            type: null,
            key: 'remove-watchlist',
            onClick: () => watchList(false),
            Component: (
                <>
                    <IoClose className="mr-2 h-4 w-4" />
                    <span className={'ml-3'}>remove from watchlist</span>
                </>
            ),
        },
        {
            key: 'watched',
            type: HistoryType.Watched,
            onClick: () => history.media.videoId ? seenVideo(true) : seenMedia(true),
            Component: (
                <>
                    <LuEye className="mr-2 h-4 w-4" />
                    <span className={'ml-3'}>mark as watched</span>
                </>
            ),
        },
        {
            type: null,
            key: 'non-watched',
            onClick: () => history.media.videoId ? seenVideo(false) : seenMedia(false),
            Component: (
                <>
                    <LuEyeOff className="mr-2 h-4 w-4" />
                    <span className={'ml-3'}>remove from history</span>
                </>
            ),
        },
        {
            type: null,
            key: 'playlist',
            onClick: openModal,
            Component: (
                <>
                    <PiQueue className="mr-2 h-4 w-4" />
                    <span className={'ml-3'}>create playlist</span>
                </>
            ),
        },
    ], [history.media.videoId, openModal, rateMedia, seenMedia, seenVideo, watchList]);

    const filterElements = useMemo(() => elements.filter((item) => item.type !== history.type), [elements, history.type]);

    return (
        <>
            <DropDownButton
                Content={<IoMdMore className={'h-6 w-6'} />}
            >
                <DropdownMenu elements={filterElements} />
            </DropDownButton>
            <PlaylistSettings
                onClose={closeModal}
                mediaId={history.media.id}
                videoId={history.media.videoId}
                name={history.media.name}
                open={isOpen}
            />
        </>
    );
}

function HistoryItem ({ history, selected, onSelect, isLastItem }: HistoryItemProps) {
    const handleSelect = useCallback(() => onSelect(history), [history, onSelect]);
    const handlePropagation = useCallback((e: MouseEvent<HTMLButtonElement>) => e.stopPropagation(), []);

    const title = useMemo(() => {
        if (history.type === HistoryType.Watched) {
            return `Watched ${history.media.name}`;
        }

        if (history.type === HistoryType.RatedPositive) {
            return `Liked ${history.media.name}`;
        }

        if (history.type === HistoryType.RatedNegative) {
            return `Disliked ${history.media.name}`;
        }

        if (history.type === HistoryType.AddedToWatchlist) {
            return `Added ${history.media.name} to watchlist`;
        }

        return '';
    }, [history]);

    return (
        <MediaLinkDiv
            className={'w-full'}
            mediaId={history.media.id}
            mediaType={history.media.type}
            name={history.media.name}
        >
            <div
                className={'flex items-center w-full gap-x-2 h-20 px-2 rounded-md group transition-all duration-300 ease-in-out hover:bg-lightL/20 hover:shadow-md text-lightest/70 hover:text-lightest'}
            >
                <Checkbox
                    checked={selected}
                    onClick={handlePropagation}
                    onCheckedChange={handleSelect}
                    className={'w-6 h-6 hover:border-lightest/50 border-2 rounded-md hover:text-lightest/50 border-transparent text-transparent data-[state=checked]:border-lightest/50 data-[state=checked]:text-lightest/50 group-hover:border-lightest/50 group-hover:text-lightest/50 transition-all duration-300 ease-in-out'}
                />
                <LazyImage
                    src={history.media.poster}
                    alt={history.media.name}
                    style={createStyles(history.media.posterBlur)}
                    className={'w-auto h-4/5 aspect-video object-contain bg-dark-200/30 rounded-md backdrop-blur-lg shadow-black shadow-sm'}
                />
                <div className={'flex grow justify-between h-full items-center'}>
                    <div className={'flex flex-col gap-y-1 mx-2'}>
                        <div className={'flex items-center justify-between gap-x-4'}>
                            <span className={'text-md font-bold'}>{title}</span>
                        </div>
                        {
                            history.media.episode && history.media.season
                                ? (
                                    <div className={'flex items-center justify-between gap-x-4'}>
                                        <span className={'text-sm font-semibold'}>Season {history.media.season}, Episode {history.media.episode}</span>
                                    </div>
                                )
                                : null
                        }
                        <div className={'flex items-center gap-x-4'}>
                            <span className={'text-sm font-semibold'}>
                                {
                                    formatDistanceToNow(history.date, {
                                        addSuffix: true,
                                    })
                                }
                            </span>
                        </div>
                    </div>
                    <HistoryMoreButton history={history} />
                </div>
            </div>
            <div
                className={
                    tw('h-0.5 bg-lightest/10 mx-2', {
                        hidden: isLastItem,
                    })
                }
            />
        </MediaLinkDiv>
    );
}

function DeleteButton ({ selected, setSelect }: DeleteButtonProps) {
    const { updateRefreshTime } = useRefreshTime();

    const handleDeleted = useCallback(() => {
        setSelect([]);
        updateRefreshTime();
    }, [setSelect, updateRefreshTime]);

    const { mutate: deleteHistory } = useMutation(activityMutations.deleteHistories(selected, handleDeleted));

    return (
        <BaseButton
            className={'h-8 text-white/80 py-1 px-4 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out shadow-black shadow-sm hover:text-white hover:shadow-md hover:shadow-black bg-red-600 hover:bg-red-500'}
            title={'Delete selected'}
            onClick={deleteHistory}
        >
            <span>delete</span>
        </BaseButton>
    );
}

function ActivityPage () {
    const { key } = useRefreshTime();
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [filters, setFilters] = useState<HistoryType[]>([]);
    const { data, fetchNextPage, isFetchingNextPage, hasNextPage, isFetching } = useInfiniteQuery(activityInfiniteQueries.get(search, filters, key));
    const performFetch = useCallback(() => !isFetchingNextPage && hasNextPage && fetchNextPage(), [fetchNextPage, hasNextPage, isFetchingNextPage]);
    const items = useMemo(() => data?.pages.flatMap((page) => page.results) ?? [], [data]);
    const isSelected = useCallback((id: string) => selected.includes(id), [selected]);
    const sortedHistory = useMemo(() => sortBy(items, 'date', 'desc'), [items]);

    const handleSelect = useCallback((item: HistorySchema) => {
        setSelected((prev) => {
            const index = prev.indexOf(item.id);

            if (index === -1) {
                return [...prev, item.id];
            }

            return prev.filter((id) => id !== item.id);
        });
    }, []);

    const handleFilter = useCallback((type: HistoryType) => {
        setFilters((prev) => {
            const index = prev.indexOf(type);

            if (index === -1) {
                return [...prev, type];
            }

            return prev.filter((item) => item !== type);
        });
    }, []);

    return (
        <div className={'flex flex-col w-full h-full gap-y-2'}>
            <div className={'px-4 w-full'}>
                <Segment.Label label={'Activity'} />
            </div>
            <div className={'flex items-center h-12 mx-4 gap-x-4'}>
                <BaseInput
                    className={'h-8 w-96'}
                    holderClassName={'items-center macbook:mb-0'}
                    onChange={setSearch}
                    placeholder={'Search'}
                    value={search}
                />
                <FilterButton selected={filters} toggle={handleFilter} />
                <div
                    className={
                        tw('gap-x-3 h-full items-center justify-end flex-1 text-sm text-nowrap font-semibold flex', {
                            'opacity-0': !selected.length,
                        })
                    }
                >
                    <DeleteButton selected={selected} setSelect={setSelected} />
                </div>
            </div>
            <div
                className={'grow overflow-y-scroll scrollbar-hide items-center justify-between p-4 rounded-md text-lightest'}
            >
                <div className={'flex flex-col justify-start w-full h-full'}>
                    <DisplayLoader loading={isFetching && items.length === 0} noItems={items.length === 0}>
                        <List
                            onEndReached={performFetch}
                            options={
                                {
                                    rootMargin: '0px 0px 100px 0px',
                                }
                            }
                        >
                            {
                                sortedHistory.map((item, index) => (
                                    <HistoryItem
                                        key={item.id}
                                        history={item}
                                        onSelect={handleSelect}
                                        selected={isSelected(item.id)}
                                        isLastItem={index === history.length - 1}
                                    />
                                ))
                            }
                        </List>
                    </DisplayLoader>
                </div>
            </div>
        </div>
    );
}

export function Activity () {
    return (
        <RefreshTimeProvider>
            <ActivityPage />
        </RefreshTimeProvider>
    );
}
