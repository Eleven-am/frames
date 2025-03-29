import { CloudDrive, StorageDetailSchema, MediaType, UnScannedItemSchema, DeleteFileArgs } from '@/api/data-contracts';
import driveLogo from '@/assets/drive.webp';
import dropboxLogo from '@/assets/dropbox.png';
import localModal from '@/assets/local.png';
import s3Logo from '@/assets/s3.png';
import { BaseButton } from '@/components/button';
import { Checkbox } from '@/components/checkbox';
import { List } from '@/components/gridList';
import { BaseInput } from '@/components/input';
import { LazyImage } from '@/components/lazyImage';
import { DisplayLoader } from '@/components/loading-set/Loading';
import { EditLibrary } from '@/components/settings/editLibrary';
import { Segment } from '@/components/settingsUI/segments';
import { Tags, TagItem } from '@/components/tags';
import { notify } from '@/components/toast';
import { useModalHook } from '@/hooks/useModalHook';
import { libraryMutations, libraryInfiniteQueries, libraryQueries } from '@/queries/settings/libraries';
import { createStyles } from '@/utils/colour';
import { firstLetterToUpperCase } from '@/utils/helpers';
import { tw } from '@/utils/style';
import { dedupeBy } from '@eleven-am/fp';

import { useMutation, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useMemo, useCallback, MouseEvent, useState, Dispatch, SetStateAction } from 'react';
import { FiFilm } from 'react-icons/fi';
import { MdOutlineViewAgenda } from 'react-icons/md';
import { PiTelevision } from 'react-icons/pi';
import { RiScanLine } from 'react-icons/ri';

interface UnScannedItemProps {
    item: UnScannedItemSchema;
    selected: boolean;
    isLastItem: boolean;
    onSelect: (item: UnScannedItemSchema) => void;
    onSaved: (item: UnScannedItemSchema) => void;
}

interface DeleteButtonProps {
    selected: DeleteFileArgs[];
    setSaved: Dispatch<SetStateAction<DeleteFileArgs[]>>;
    setSelected: Dispatch<SetStateAction<DeleteFileArgs[]>>;
}

const driveInfo = [
    {
        logo: driveLogo,
        color: '149, 173, 121',
        type: CloudDrive.GDRIVE,
        buttonLabel: 'connect to google drive',
    },
    {
        logo: dropboxLogo,
        color: '61, 114, 227',
        type: CloudDrive.DROPBOX,
        buttonLabel: 'connect to dropbox',
    },
    {
        logo: s3Logo,
        color: '222, 141, 71',
        type: CloudDrive.S3,
        buttonLabel: 'connect to box',
    },
    {
        logo: localModal,
        color: '181, 53, 84',
        type: CloudDrive.LOCAL,
        buttonLabel: 'connect to local',
    },
];

function SingleLibrary ({ library }: { library: StorageDetailSchema }) {
    const file = useMemo(() => driveInfo.find((drive) => drive.type === library.storageType), [library.storageType]);
    const { mutate: scanStorage } = useMutation(libraryMutations.scanStorage(library.storageId));
    const { mutate: scanLibrary } = useMutation(libraryMutations.scanLibrary(library.storageId));

    const manageLibrary = useCallback((type: MediaType) => () => {
        scanLibrary(type);
        notify({
            browserId: 'scan-started',
            title: `${firstLetterToUpperCase(type)} scan started`,
            content: `The ${type.toLowerCase()} scan has been started`,
        });
    }, [scanLibrary]);

    const tags = useMemo(() => {
        const tags = [
            {
                tag: {
                    key: 'owner',
                    value: library.owner,
                },
            },
        ];

        if (library.hasMovieLocations) {
            tags.push({
                tag: {
                    key: 'movies',
                    value: library.movies.toString(),
                },
            });
        }

        if (library.hasShowLocations) {
            tags.push({
                tag: {
                    key: 'shows',
                    value: library.shows.toString(),
                },
            });
        }

        return tags;
    }, [
        library.hasMovieLocations,
        library.hasShowLocations,
        library.movies,
        library.shows,
        library.owner,
    ]);

    const unScannedTags = useMemo(() => {
        const tags: TagItem[] = [];

        if (library.hasMovieLocations) {
            tags.push({
                tag: {
                    key: 'un-scanned movies',
                    value: library.unScannedMovies.toString(),
                },
            });
        }

        if (library.hasShowLocations) {
            tags.push({
                tag: {
                    key: 'un-scanned shows',
                    value: library.unScannedShows.toString(),
                },
            });
        }

        return tags;
    }, [
        library.hasMovieLocations,
        library.hasShowLocations,
        library.unScannedMovies,
        library.unScannedShows,
    ]);

    if (!file) {
        return null;
    }

    return (
        <Segment.Container className={'shadow-black/50 mb-4 shadow-md text-lightest'}>
            <Segment className={'justify-between'}>
                <h3 className={'fullHD:text-lg font-semibold line-clamp-1 text-nowrap'}>
                    {library.name}
                </h3>
                <LazyImage src={file.logo} alt={file.buttonLabel} className={'h-6 max-w-6 object-contain'} />
            </Segment>
            {
                (library.hasMovieLocations || library.hasShowLocations) && (
                    <Segment className={'justify-between'}>
                        <h3 className={'fullHD:text-lg font-semibold line-clamp-1 text-nowrap'}>
                            Scan {library.name}
                        </h3>
                        <BaseButton title={'Scan Library'} onClick={scanStorage}>
                            <RiScanLine className={'h-6 w-6'} />
                        </BaseButton>
                    </Segment>
                )
            }
            {
                (library.hasMovieLocations || library.hasShowLocations) && (
                    <Segment className={'justify-between'}>
                        <Tags tags={unScannedTags} />
                        <MdOutlineViewAgenda className={'w-5 h-5'} />
                    </Segment>
                )
            }
            {
                library.hasMovieLocations && (
                    <Segment className={'justify-between'}>
                        <h3 className={'fullHD:text-lg font-semibold line-clamp-1 text-nowrap'}>
                            Scan for movies
                        </h3>
                        <BaseButton title={'Scan for Movies'} onClick={manageLibrary(MediaType.MOVIE)}>
                            <FiFilm className={'h-6 w-6'} />
                        </BaseButton>
                    </Segment>
                )
            }
            {
                library.hasShowLocations && (
                    <Segment className={'justify-between'}>
                        <h3 className={'fullHD:text-lg font-semibold line-clamp-1 text-nowrap'}>
                            Scan for shows
                        </h3>
                        <BaseButton title={'Scan for Shows'} onClick={manageLibrary(MediaType.SHOW)}>
                            <PiTelevision className={'h-6 w-6'} />
                        </BaseButton>
                    </Segment>
                )
            }
            <Segment className={'justify-center'} isLast>
                <Tags
                    className={'w-full flex justify-between'}
                    tags={tags}
                />
            </Segment>
        </Segment.Container>
    );
}

function UnScannedItem ({ item, selected, isLastItem, onSelect, onSaved }: UnScannedItemProps) {
    const modalHook = useModalHook();
    const handleSelect = useCallback(() => onSelect(item), [item, onSelect]);
    const handlePropagation = useCallback((e: MouseEvent<HTMLButtonElement>) => e.stopPropagation(), []);

    const handleOnSaved = useCallback(() => {
        onSaved(item);
        modalHook.closeModal();
        notify({
            success: true,
            browserId: 'edit-library',
            title: 'Media Created',
            content: 'The media item has successfully been created',
        });
    }, [item, modalHook, onSaved]);

    return (
        <div className={'w-full'}>
            <div
                onClick={modalHook.openModal}
                className={'flex items-center cursor-pointer w-full gap-x-2 h-20 px-2 rounded-md group transition-all duration-300 ease-in-out hover:bg-lightL/20 hover:shadow-md text-lightest/70 hover:text-lightest'}
            >
                <Checkbox
                    checked={selected}
                    onClick={handlePropagation}
                    onCheckedChange={handleSelect}
                    className={'w-6 h-6 hover:border-lightest/50 border-2 rounded-md hover:text-lightest/50 border-transparent text-transparent data-[state=checked]:border-lightest/50 data-[state=checked]:text-lightest/50 group-hover:border-lightest/50 group-hover:text-lightest/50 transition-all duration-300 ease-in-out'}
                />
                {
                    item.poster && item.posterBlur && (
                        <LazyImage
                            alt={item.name}
                            src={item.poster}
                            style={createStyles(item.posterBlur)}
                            className={'w-auto h-4/5 aspect-video object-contain bg-dark-200/30 rounded-md backdrop-blur-lg shadow-black shadow-sm'}
                        />
                    )
                }
                <div className={'flex grow justify-between h-full items-center'}>
                    <div className={'flex flex-col gap-y-1 mx-2'}>
                        <div className={'flex items-center justify-between gap-x-4'}>
                            <span className={'text-md font-bold'}>
                                {item.name} ({item.year})
                            </span>
                        </div>
                        <div className={'flex items-center justify-between gap-x-4'}>
                            <span className={'text-sm font-semibold'}>
                                TmDB id, {item.tmdbId}
                            </span>
                        </div>
                        <div className={'flex items-center gap-x-4'}>
                            <span className={'text-sm font-semibold'}>
                                {item.filename}
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
            <EditLibrary onClosed={modalHook.closeModal} isOpen={modalHook.isOpen} media={item} onSaved={handleOnSaved} />
        </div>
    );
}

function DeleteButton ({ selected, setSaved, setSelected }: DeleteButtonProps) {
    const { mutate: deleteMedia } = useMutation(libraryMutations.deleteFile);

    const handleHDelete = useCallback(() => {
        selected.forEach((id) => deleteMedia(id));
        setSaved(prevState => dedupeBy([...prevState, ...selected], ['filepath', 'storageId']));
        setSelected([]);
    }, [setSaved, selected, deleteMedia, setSelected]);

    if (selected.length === 0) {
        return null;
    }

    return (
        <BaseButton
            className={'h-8 text-white/80 py-1 px-4 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out shadow-black shadow-sm hover:text-white hover:shadow-md hover:shadow-black bg-red-600 hover:bg-red-500'}
            title={'Delete Selected'}
            onClick={handleHDelete}
        >
            <span>delete</span>
        </BaseButton>
    );
}

export function UnScannedList () {
    const [search, setSearch] = useState('');
    const [saved, setSaved] = useState<DeleteFileArgs[]>([]);
    const [selected, setSelected] = useState<DeleteFileArgs[]>([]);
    const { data, fetchNextPage, isFetchingNextPage, hasNextPage, isFetching } = useInfiniteQuery(libraryInfiniteQueries.listAll(search));
    const items = useMemo(() => data?.pages.flatMap((page) => page.results) ?? [], [data]);
    const performFetch = useCallback(() => !isFetchingNextPage && hasNextPage && fetchNextPage(), [fetchNextPage, hasNextPage, isFetchingNextPage]);
    const isSelected = useCallback((item: UnScannedItemSchema) => selected.some((selected) => selected.filepath === item.filepath && selected.storageId === item.storageId), [selected]);
    const filtered = useMemo(() => items.filter((item) => !saved.some((selected) => selected.filepath === item.filepath && selected.storageId === item.storageId)), [items, saved]);

    const handleAction = useCallback((setAction: Dispatch<SetStateAction<DeleteFileArgs[]>>) => (item: UnScannedItemSchema) => {
        setAction((prev) => {
            const index = prev.findIndex((selected) => selected.filepath === item.filepath && selected.storageId === item.storageId);

            if (index === -1) {
                return [...prev, { filepath: item.filepath, storageId: item.storageId }];
            }

            return prev.filter((selected) => selected.filepath !== item.filepath || selected.storageId !== item.storageId);
        });
    }, []);

    return (
        <div className={'flex flex-col w-full h-full gap-y-2'}>
            <div className={'px-4 w-full'}>
                <Segment.Label label={'Un-scanned Media'} />
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
                    className={
                        tw('gap-x-3 h-full items-center justify-between flex-1 text-sm text-nowrap font-semibold flex')
                    }
                >
                    <BaseButton
                        title={'Select All'}
                        to={'/settings/libraries'}
                        className={'h-8 text-white/80 py-1 px-4 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out shadow-black shadow-sm hover:text-white hover:shadow-md hover:shadow-black bg-darkD/70 hover:bg-darkM/70'}
                    >
                        manage libraries
                    </BaseButton>
                    <DeleteButton
                        selected={selected}
                        setSaved={setSaved}
                        setSelected={setSelected}
                    />
                </div>
            </div>
            <div
                className={'grow overflow-y-scroll scrollbar-hide items-center justify-between p-4 rounded-md text-lightest mb-4'}
            >
                <div className={'flex flex-col justify-start w-full h-full'}>
                    <DisplayLoader loading={isFetching && items.length === 0} noItems={filtered.length === 0}>
                        <List
                            onEndReached={performFetch}
                            options={
                                {
                                    rootMargin: '0px 0px 100px 0px',
                                }
                            }
                        >
                            {
                                filtered.map((item, index) => (
                                    <UnScannedItem
                                        item={item}
                                        key={`${item.filepath}-${item.storageId}`}
                                        selected={isSelected(item)}
                                        onSaved={handleAction(setSaved)}
                                        onSelect={handleAction(setSelected)}
                                        isLastItem={index === filtered.length - 1}
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

export function LibrariesList () {
    const { data } = useQuery(libraryQueries.listStorages);

    return (
        <div className={'flex flex-col w-full ipadMini:w-1/2'}>
            <Segment.Section>
                <Segment.Label label={'Manage Libraries'} />
                <Link
                    className={'w-full'}
                    to={'/settings/unscanned'}
                    title={'Go to Un-scanned Media'}
                >
                    <Segment.Container className={'shadow-black/50 shadow-md bg-darkM/90 text-lightest mb-4'}>
                        <Segment>
                            <span>Goto Un-scanned Media</span>
                        </Segment>
                    </Segment.Container>
                </Link>
                {
                    data.map((library) => (
                        <SingleLibrary key={library.storageId} library={library} />
                    ))
                }
            </Segment.Section>
        </div>
    )
}
