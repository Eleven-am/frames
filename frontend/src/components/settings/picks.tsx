import { PickType, PickResponseSchema, SlimMediaSchema } from '@/api/data-contracts';
import { BaseButton } from '@/components/button';
import { Checkbox } from '@/components/checkbox';
import { List } from '@/components/gridList';
import { BaseInput } from '@/components/input';
import { LazyImage } from '@/components/lazyImage';
import { PickModal } from '@/components/settings/picksModal';
import { Segment } from '@/components/settingsUI/segments';
import { TabsHolder } from '@/components/tabs';
import { useRefreshTime } from '@/contexts/refreshTime';
import { useModalHook } from '@/hooks/useModalHook';
import { picksInfiniteQueries, picksMutations } from '@/queries/settings/picks';
import { createStyles } from '@/utils/colour';
import { tw } from '@/utils/style';
import { sortBy } from '@eleven-am/fp';
import { useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { useState, useCallback, useMemo, MouseEvent } from 'react';
import { DisplayLoader } from '../loading-set/Loading';

interface PickItemProps {
    pick: PickResponseSchema;
    selected: boolean;
    isLastItem: boolean;
    onSuccess: () => void;
    onSelect: (pick: PickResponseSchema) => void;
}

interface DeleteButtonProps {
    selected: string[];
    onSuccess: () => void;
    setSelect: (selected: string[]) => void;
}

interface PockListProps {
    type: PickType;
    search: string;
    onSuccess: () => void;
    handleSelect: (pick: PickResponseSchema) => void;
    isSelected: (pick: PickResponseSchema) => boolean;
}

enum PickTabs {
    EDITORIAL = 'Editorial Picks',
    BASIC = 'Basic Picks',
    BANNER = 'Banner Pick',
}

function PickItem ({ pick, selected, onSelect, isLastItem, onSuccess }: PickItemProps) {
    const { isOpen, openModal, closeModal } = useModalHook()
    const handleClicked = useCallback(() => openModal(), [openModal]);
    const handlePropagation = useCallback((e: MouseEvent<HTMLButtonElement>) => e.stopPropagation(), []);

    const handleSelect = useCallback(() => onSelect(pick), [onSelect, pick]);
    const item = useMemo((): SlimMediaSchema | null => sortBy(pick.media, 'index', 'asc')[0]?.media ?? null, [pick.media]);

    return (
        <div className={'w-full'} onClick={handleClicked}>
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
                    src={item?.poster ?? ''}
                    alt={item?.name ?? ''}
                    style={createStyles(item?.portraitBlur ?? '0,0,0')}
                    className={'w-auto h-4/5 aspect-video object-contain bg-dark-200/30 rounded-md backdrop-blur-lg shadow-black shadow-sm'}
                />
                <div className={'flex grow justify-between h-full items-center'}>
                    <div className={'flex flex-col gap-y-1 mx-2'}>
                        <div className={'flex items-center justify-between gap-x-4'}>
                            <span className={'text-md font-bold'}>{pick.name}</span>
                        </div>
                        <div className={'flex items-center gap-x-4'}>
                            <span className={'text-sm font-semibold'}>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div
                className={
                    tw('h-0.5 bg-lightest/10 mx-2', {
                        hidden: isLastItem,
                    })
                }
            />
            <PickModal isOpen={isOpen} onClose={closeModal} initialData={pick} onSuccess={onSuccess}/>
        </div>
    );
}

function DeleteButton ({ selected, setSelect, onSuccess }: DeleteButtonProps) {
    const { updateRefreshTime } = useRefreshTime();

    const handleDeleted = useCallback(() => {
        setSelect([]);
        onSuccess();
    }, [setSelect, onSuccess, updateRefreshTime]);

    const { mutate: deleteHistory } = useMutation(picksMutations.deletePicks(selected, handleDeleted));

    if (!selected.length) {
        return null;
    }

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

function CreatePickButton ({ onSuccess }: { onSuccess: () => void }) {
    const { isOpen, openModal, closeModal } = useModalHook();

    return (
        <>
            <BaseButton
                className={'h-8 text-white/80 py-1 px-4 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out shadow-black shadow-sm hover:text-white hover:shadow-md hover:shadow-black bg-darkD/70 hover:bg-darkM/70'}
                title={'Create a new pick'}
                onClick={openModal}
            >
                <span>create pick</span>
            </BaseButton>
            <PickModal
                isOpen={isOpen}
                onClose={closeModal}
                onSuccess={onSuccess}
                initialData={
                    {
                        id: '',
                        name: '',
                        index: 0,
                        media: [],
                        isActive: true,
                        type: PickType.BASIC,
                    }
                }
            />
        </>
    );
}

function PickList ({ type, search, handleSelect, isSelected, onSuccess }: PockListProps) {
    const { data, fetchNextPage, isFetchingNextPage, hasNextPage, isFetching } = useInfiniteQuery(picksInfiniteQueries.get(type));
    const picks = useMemo(() => data?.pages.flatMap((p) => p.results) ?? [], [data]);
    const items = useMemo(() => picks.filter((p) => p.name.toLowerCase()
        .includes(search.toLowerCase())), [picks, search]);

    const performFetch = useCallback(() => !isFetchingNextPage && hasNextPage && fetchNextPage(), [fetchNextPage, hasNextPage, isFetchingNextPage]);

    return (
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
                    items.map((pick, index) => (
                        <PickItem
                            pick={pick}
                            key={pick.id}
                            onSuccess={onSuccess}
                            onSelect={handleSelect}
                            selected={isSelected(pick)}
                            isLastItem={index === items.length - 1}
                        />
                    ))
                }
            </List>
        </DisplayLoader>
    );
}

export function PicksPage () {
    const [search, setSearch] = useState('');
    const [refreshTime, setRefreshTime] = useState(0);
    const [selected, setSelected] = useState<string[]>([]);

    const handleSelect = useCallback((pick: PickResponseSchema) => {
        setSelected((prev) => {
            if (prev.includes(pick.id)) {
                return prev.filter((id) => id !== pick.id);
            }

            return [...prev, pick.id];
        });
    }, []);

    const handleRefresh = useCallback(() => setRefreshTime((prev) => prev + 1), []);
    const isSelected = useCallback((pick: PickResponseSchema) => selected.includes(pick.id), [selected]);

    return (
        <div className={'flex flex-col w-full h-full gap-y-2'}>
            <div className={'px-4 w-full'}>
                <Segment.Label label={'Picks'}/>
            </div>
            <div className={'flex items-center h-12 mx-4 gap-x-4'}>
                <BaseInput
                    className={'h-8 w-96'}
                    holderClassName={'items-center macbook:mb-0'}
                    onChange={setSearch}
                    placeholder={'Search'}
                    value={search}
                />
                <div
                    className={'gap-x-3 h-full items-center justify-end flex-1 text-sm text-nowrap font-semibold flex'}>
                    <CreatePickButton onSuccess={handleRefresh} />
                    <DeleteButton selected={selected} setSelect={setSelected} onSuccess={handleRefresh} />
                </div>
            </div>
            <TabsHolder
                tabs={[PickTabs.BASIC, PickTabs.EDITORIAL, PickTabs.BANNER]}
                components={[
                    {
                        activeWhen: [PickTabs.BASIC],
                        component: <PickList
                            search={search}
                            key={refreshTime}
                            type={PickType.BASIC}
                            isSelected={isSelected}
                            onSuccess={handleRefresh}
                            handleSelect={handleSelect}
                        />,
                    },
                    {
                        activeWhen: [PickTabs.EDITORIAL],
                        component: <PickList
                            search={search}
                            key={refreshTime}
                            type={PickType.EDITOR}
                            isSelected={isSelected}
                            onSuccess={handleRefresh}
                            handleSelect={handleSelect}
                        />,
                    },
                ]}
                underlineClassName={'h-1 bg-lightest text-shadow-md'}
                activeLiClassName={'text-lightest hover:text-lightest/80'}
                wrapperClassName={'grow mb-4 overflow-hidden flex flex-col'}
                componentWrapperClassName={'grow overflow-y-scroll scrollbar-hide mx-4 my-2'}
                holderClassName={'mx-4 -mt-1 border-b-2 border-lightest/40 text-lightest/70'}
                liClassName={'font-medium text-md p-3 transition-all duration-300 hover:text-lightest/70'}
            />
        </div>
    );
}
