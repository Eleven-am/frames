import { useState, useMemo, useCallback } from 'react';

import { sortBy } from '@eleven-am/fp';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { TbDownload, TbDownloadOff } from 'react-icons/tb';

import { DownloadItemSchema } from '@/api/data-contracts';
import { DropdownContent, DropDownButton, DropdownMenu, BaseButton } from '@/components/button';
import { BaseInput } from '@/components/input';
import { LazyImage } from '@/components/lazyImage';
import { MediaLinkDiv } from '@/components/listItem';
import { DisplayLoader } from '@/components/loading-set/Loading';
import { Segment } from '@/components/settingsUI/segments';
import { notify } from '@/components/toast';
import { profileQueries } from '@/queries/settings/profile';
import { createStyles } from '@/utils/colour';
import { tw } from '@/utils/style';


enum DownloadType {
    ACCESSIBLE = 'accessible',
    UN_ACCESSIBLE = 'un_accessible',
}

interface FilterButtonProps {
    selected: DownloadType[];
    toggle: (type: DownloadType) => void;
}

interface DownloadItemProps {
    item: DownloadItemSchema;
    isLastItem: boolean;
}

function FilterButton ({ selected, toggle }: FilterButtonProps) {
    const elements = useMemo((): DropdownContent[] => [
        {
            key: 'Downloadable',
            active: selected.includes(DownloadType.ACCESSIBLE),
            onClick: () => toggle(DownloadType.ACCESSIBLE),
            Component: (
                <>
                    <TbDownload className="mr-2 h-4 w-4" />
                    <span className={'ml-3'}>downloadable</span>
                </>
            ),
        },
        {
            key: 'Expired',
            active: selected.includes(DownloadType.UN_ACCESSIBLE),
            onClick: () => toggle(DownloadType.UN_ACCESSIBLE),
            Component: (
                <>
                    <TbDownloadOff className="mr-2 h-4 w-4" />
                    <span className={'ml-3'}>expired</span>
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

function DownloadItem ({ item, isLastItem }: DownloadItemProps) {
    const handleDownload = useCallback(() => {
        window.location.href = `/api/downloads/${item.location}`;

        notify({
            title: 'Download started',
            content: 'Your download has started',
            browserId: 'download',
            success: true,
        });
    }, [item.location]);

    return (
        <MediaLinkDiv
            className={'w-full'}
            mediaId={item.id}
            mediaType={item.type}
            name={item.name}
        >
            <div
                className={'flex items-center w-full gap-x-2 h-20 px-2 rounded-md group transition-all duration-300 ease-in-out hover:bg-lightL/20 hover:shadow-md text-lightest/70 hover:text-lightest'}
            >
                <LazyImage
                    src={item.backdrop}
                    alt={item.name}
                    style={createStyles(item.backdropBlur)}
                    className={'w-auto h-4/5 aspect-video object-contain bg-dark-200/30 rounded-md backdrop-blur-lg shadow-black shadow-sm'}
                />
                <div className={'flex grow justify-between h-full items-center'}>
                    <div className={'flex flex-col gap-y-1 mx-2'}>
                        <div className={'flex items-center justify-between gap-x-4'}>
                            <span className={'text-md font-bold'}>{item.name}</span>
                        </div>
                        {
                            item.episodeName
                                ? (
                                    <div className={'flex items-center justify-between gap-x-4'}>
                                        <span className={'text-sm font-semibold'}>{item.episodeName}</span>
                                    </div>
                                )
                                : null
                        }
                        <div className={'flex items-center gap-x-4'}>
                            <span className={'text-sm font-semibold'}>
                                {
                                    formatDistanceToNow(item.createdAt, {
                                        addSuffix: true,
                                    })
                                }
                            </span>
                        </div>
                    </div>
                    {
                        item.isAccessible &&
                            (
                                <BaseButton
                                    onClick={handleDownload}
                                    title={`Download ${item.name}`}
                                >
                                    <TbDownload className={'h-6 w-6'} />
                                </BaseButton>
                            )
                    }
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

export function Download () {
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState<DownloadType[]>([]);
    const { data, isFetching } = useQuery(profileQueries.downloads);

    const items = useMemo(() => sortBy(
        data
            .filter((item) => {
                const name = item.name.toLowerCase();
                const searchQuery = search.trim().toLowerCase();
                const episodeName = item.episodeName?.toLowerCase() || '';
                const downloadType = item.isAccessible ? DownloadType.ACCESSIBLE : DownloadType.UN_ACCESSIBLE;
                const isFilter = filters.length === 0 || filters.includes(downloadType);
                const isSearch = name.includes(searchQuery) || episodeName.includes(searchQuery);

                return isFilter && isSearch;
            }),
        'createdAt',
        'desc',
    ), [data, filters, search]);

    const handleFilter = useCallback((type: DownloadType) => {
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
                <Segment.Label label={'Downloads'} />
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
            </div>
            <div
                className={'grow overflow-y-scroll scrollbar-hide items-center justify-between p-4 rounded-md text-lightest'}
            >
                <div className={'flex flex-col justify-start w-full h-full'}>
                    <DisplayLoader loading={isFetching && items.length === 0} noItems={items.length === 0}>
                        {
                            items.map((item, index) => (
                                <DownloadItem
                                    item={item}
                                    key={item.location}
                                    isLastItem={index === items.length - 1}
                                />
                            ))
                        }
                    </DisplayLoader>
                </div>
            </div>
        </div>
    );
}
