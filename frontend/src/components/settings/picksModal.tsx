import { SlimMediaSchema, PickType, PickResponseSchema, PickMediaSchema } from '@/api/data-contracts';
import { BaseButton } from '@/components/button';
import { DragNDropElementProps, DragNDropProvider } from '@/components/DragNDrop';
import { TransformingInput, BaseInput } from '@/components/input';
import { LazyImage } from '@/components/lazyImage';
import { NoLinkLargeRecommendation } from '@/components/listItem';
import { DisplayLoader } from '@/components/loading-set/Loading';
import { Modal } from '@/components/modal';
import { FramesSelect } from '@/components/select';
import { BaseSection } from '@/components/settingsUI/baseSections';
import { Switch } from '@/components/switch';
import { TabsHolder } from '@/components/tabs';
import { useModalHook } from '@/hooks/useModalHook';
import { playlistInfiniteQueries } from '@/queries/playlist';
import { picksActions } from '@/queries/settings/picks';
import { createStyles } from '@/utils/colour';
import { sortBy } from '@eleven-am/fp';
import { useInfiniteScroll, useAutoSaveAction } from '@eleven-am/xquery';
import { createContext, useContext, useState, useCallback } from 'react';
import { FiMenu, FiSearch } from 'react-icons/fi';
import { HiOutlineTrash } from 'react-icons/hi2';

interface PicksContext {
    name: string;
    open: boolean;
    type: PickType;
    isActive: boolean;
    close: () => void;
    media: PickMediaSchema[];
    setName: (name: string) => void;
    setActive: (active: boolean) => void;
    setPickType: (pickType: PickType) => void;
    addMedia: (media: SlimMediaSchema) => void;
    removeMedia: (media: SlimMediaSchema) => void;
    reOrderMedia: (media: SlimMediaSchema[]) => void;
}

interface PicksProviderProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData: PickResponseSchema;
}

type MediaItemProps = DragNDropElementProps<SlimMediaSchema>;

enum CreatePickTabs {
    GENERAL = 'General',
    MEDIA = 'Media',
}

const context = createContext<PicksContext>({
    name: '',
    media: [],
    open: false,
    isActive: false,
    type: PickType.BASIC,
    close: () => {},
    setName: () => {},
    addMedia: () => {},
    setActive: () => {},
    setPickType: () => {},
    removeMedia: () => {},
    reOrderMedia: () => {},
});

function usePicksContext () {
    return useContext(context);
}

function GeneralTab () {
    const { name, isActive, type, setName, setActive, setPickType } = usePicksContext();

    return (
        <div className={'flex flex-col justify-start w-full h-full overflow-hidden overflow-y-scroll scrollbar-hide gap-y-8 px-4'}>
            <BaseSection
                label={'General'}
                description={'This is what frames displays as the title for the list of media in this editorial pick.'}
                settings={
                    [
                        {
                            label: 'Name',
                            rightElement: <TransformingInput
                                iconClassName={'text-lightest/50 ml-1 w-3 h-3 mr-2'}
                                className={'text-lightest text-lg'}
                                element={'input'}
                                onChange={setName}
                                value={name}
                                iconLeft
                            />,
                        },
                    ]
                }
            />
            <BaseSection
                description={'Setting is active to false effectively hides the pick from the user interface. This is useful for drafts or picks that are not ready to be displayed. The pick type changes the way the each media item is displayed.'}
                settings={
                    [
                        {
                            label: 'Active',
                            rightElement: <Switch isSelected={isActive} onChange={setActive} />,
                        },
                        {
                            label: 'Pick Type',
                            rightElement: (
                                <FramesSelect
                                    options={[PickType.BASIC, PickType.EDITOR]}
                                    onChange={setPickType}
                                    value={type}
                                />
                            ),
                        },
                    ]
                }
            />
        </div>
    );
}

function MediaItem ({ item, attributes, setNodeRef, listeners, style }: MediaItemProps) {
    const { removeMedia } = usePicksContext();
    const handleRemove = useCallback(() => removeMedia(item), [removeMedia]);

    return (
        <li
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={'group relative flex items-center mx-4 gap-x-4 text-light-800/60 hover:text-light-900 transition-all duration-300 ease-in-out'}
        >
            <FiMenu {...listeners} className={'w-6 h-6 cursor-grab'} />
            <LazyImage
                className={'w-24 aspect-video object-contain bg-dark-200/30 rounded-md backdrop-blur-lg shadow-black shadow-sm'}
                src={item.poster}
                alt={item.name}
            />
            <span className={'text-md font-bold text-shadow-md'}>{item.name}</span>
            <BaseButton
                onClick={handleRemove}
                title={`Delete ${item.name}`}
                className={'w-6 h-6 absolute right-0'}
            >
                <HiOutlineTrash className={'w-6 h-6'} />
            </BaseButton>
        </li>
    );
}

function MediaTab () {
    const [search, setSearch] = useState('');
    const { media, addMedia, reOrderMedia } = usePicksContext();
    const { isOpen, openModal, closeModal } = useModalHook();
    const [results, ref] = useInfiniteScroll(playlistInfiniteQueries.searchPlaylists(search));

    const handleAddMedia = useCallback((media: SlimMediaSchema) => () => {
        setSearch('');
        addMedia(media);
    }, [closeModal, addMedia]);

    return (
        <>
            <div className={'flex flex-col gap-x-4 h-full p-1'}>
                <div className={'flex items-center h-16 mx-4 gap-x-4'}>
                    <BaseButton
                        className={'h-8 text-white/80 py-2 px-4 text-sm rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out shadow-black shadow-sm hover:text-white hover:shadow-md hover:shadow-black bg-dark-700/70 hover:bg-dark-700/80'}
                        title={'Create a new pick'}
                        onClick={openModal}
                    >
                        <span>create pick</span>
                    </BaseButton>
                </div>
                <div className={'grow overflow-y-scroll scrollbar-hide mx-4 gap-x-4 mt-4'}>
                    <DisplayLoader noItems={media.length === 0} loading={false}>
                        <DragNDropProvider<SlimMediaSchema>
                            onDrop={reOrderMedia}
                            Component={MediaItem}
                            elements={media.map((item) => item.media)}
                            className={'w-full h-full overflow-y-scroll scrollbar-hide flex flex-col gap-y-4'}
                        />
                    </DisplayLoader>
                </div>
            </div>
            <Modal
                open={isOpen}
                onClose={closeModal}
                style={createStyles(media[0]?.media.backdropBlur ?? '0, 0, 0')}
                className={'flex flex-col items-center justify-start w-10/12 h-4/5 px-4 py-8 space-y-4 bg-dark-600/60 backdrop-blur-lg rounded-xl border-2 border-lightest shadow-black shadow-lg'}
            >
                <BaseInput
                    onChange={setSearch}
                    className={'flex font-medium bg-transparent w-64 ipadPro:w-96 h-10 py-1 mr-2 text-lightest text-md border-none ring-0 focus:outline-none focus:ring-0 focus:border-lightest/100 placeholder-lightest/60'}
                    holderClassName={'group flex items-center h-10 text-lightest text-lg font-medium border-2 rounded-xl px-2 ipadMini:mr-2 cursor-pointer border-lightest transition-all duration-300 ease-in-out'}
                    placeholder="search for media"
                    iconPosition={'right'}
                    icon={<FiSearch className={'w-6 h-6'} />}
                    value={search}
                    type={'text'}
                />
                <div
                    className={'grid grid-cols-1 ipadMini:grid-cols-2 ipadPro:grid-cols-3 fullHD:grid-cols-4 gap-4 max-w-full max-h-full overflow-y-scroll scrollbar-hide border-t-2 border-lightest/5 py-8'}
                >
                    {
                        results.map((media) => (
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
                    <div className={'w-full h-1'} ref={ref} />
                </div>
            </Modal>
        </>
    )
}

function PickInternalModal () {
    const { media, open, close } = usePicksContext();

    return (
        <Modal
            open={open}
            onClose={close}
            style={createStyles(media[0]?.media.backdropBlur ?? '0, 0, 0')}
            className={'flex flex-col overflow-clip items-center justify-start w-3/5 imacPro:w-2/5 h-2/3 px-4 py-8 bg-dark-500/90 backdrop-blur-lg rounded-xl border-2 border-lightest shadow-black shadow-lg'}
        >
            <LazyImage
                src={media[0]?.media.backdrop}
                alt={media[0]?.media.name}
                className={'absolute inset-0 object-cover w-full h-full opacity-5'}
            />
            <div className={'flex items-center text-2xl font-bold justify-center w-full h-full space-x-4'}>
                <TabsHolder
                    vertical
                    tabs={[CreatePickTabs.GENERAL, CreatePickTabs.MEDIA]}
                    activeLiClassName={'text-lightest/100'}
                    liClassName={'text-lightest/60 hover:text-lightest/100'}
                    wrapperClassName={'h-full w-full flex items-start justify-between'}
                    holderClassName={'flex items-start justify-between h-full border-r-2 border-lightest/20'}
                    ulClassName={'h-full justify-center text-lg font-medium gap-y-4 px-8'}
                    underlineClassName={'relative w-[2px] bg-lightest/100'}
                    components={[
                        {
                            activeWhen: [CreatePickTabs.GENERAL],
                            component: <GeneralTab />,
                        },
                        {
                            activeWhen: [CreatePickTabs.MEDIA],
                            component: <MediaTab />,
                        }
                    ]}
                />
            </div>
        </Modal>
    )
}

export function PickModal ({ isOpen, onClose, initialData, onSuccess }: PicksProviderProps) {
    const [pickData, setPickData] = useAutoSaveAction({
        delay: 2000,
        options: picksActions.modal(initialData),
    });

    const setName = useCallback((name: string) => {
        setPickData((prev): PickResponseSchema => ({ ...prev, name }));
    }, [setPickData]);

    const setActive = useCallback((isActive: boolean) => {
        setPickData((prev): PickResponseSchema => ({ ...prev, isActive }));
    }, [setPickData]);

    const setPickType = useCallback((type: PickType) => {
        setPickData((prev): PickResponseSchema => ({ ...prev, type }));
    }, [setPickData]);

    const addMedia = useCallback((media: SlimMediaSchema) => {
        if (pickData.media.some((item) => item.media.id === media.id)) {
            return;
        }

        const newMedia = [...pickData.media, { media, index: pickData.media.length }];
        setPickData((prev): PickResponseSchema => ({ ...prev, media: newMedia }));
    }, [setPickData, pickData.media]);

    const removeMedia = useCallback((media: SlimMediaSchema) => {
        const deletedMedia = sortBy(pickData.media.filter((item) => item.media.id !== media.id), 'index', 'asc');
        const newMedia = deletedMedia.map((item, index): PickMediaSchema => ({ media: item.media, index }));
        setPickData((prev): PickResponseSchema => ({ ...prev, media: newMedia }));
    }, [setPickData, pickData.media]);

    const reOrderMedia = useCallback((media: SlimMediaSchema[]) => {
        const newMedia = media.map((item, index): PickMediaSchema => ({ media: item, index }));
        setPickData((prev): PickResponseSchema => ({ ...prev, media: newMedia }));
    }, [setPickData]);

    const close = useCallback(() => {
        onSuccess();
        onClose();
    }, [onClose, onSuccess]);

    return (
        <context.Provider
            value={
                {
                    setName,
                    addMedia,
                    setActive,
                    setPickType,
                    removeMedia,
                    open: isOpen,
                    close: close,
                    reOrderMedia,
                    type: pickData.type,
                    name: pickData.name,
                    isActive: pickData.isActive,
                    media: sortBy(pickData.media, 'index', 'asc'),
                }
            }
        >
            <PickInternalModal />
        </context.Provider>
    );
}
