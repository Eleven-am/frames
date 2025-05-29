import { ChangeEvent, createContext, useCallback, useContext, useMemo, useState } from 'react';

import { sortBy } from '@eleven-am/fp';
import { useAutoSaveAction } from '@eleven-am/xquery';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { HiOutlineDocumentSearch } from 'react-icons/hi';
import { HiOutlineTrash } from 'react-icons/hi2';

import { EpisodeFileSchema, FrontImagesSchema, GetMediaSchema, MediaType } from '@/api/data-contracts';
import { RoundedButton } from '@/components/button';
import { EditImages } from '@/components/editImages';
import { TransformingInput } from '@/components/input';
import { LazyImage } from '@/components/lazyImage';
import { DisplayLoader } from '@/components/loading-set/Loading';
import { Modal } from '@/components/modal';
import { BaseSection } from '@/components/settingsUI/baseSections';
import { Segment } from '@/components/settingsUI/segments';
import { TabsHolder } from '@/components/tabs';
import { notify } from '@/components/toast';
import { useDialogActions } from '@/providers/dialogStore';
import { mediaActions, mediaQueries } from '@/queries/media';
import { libraryMutations } from '@/queries/settings/libraries';
import { createStyles } from '@/utils/colour';


enum EditMediaTabs {
    General = 'General',
    Images = 'Images',
    Episodes = 'Episodes',
    Permissions = 'Permissions',
}

interface EditMediaContext {
    media: GetMediaSchema;
    images: FrontImagesSchema;
    episodes: EpisodeFileSchema[];
    setName: (name: string) => void;
    setBackdrop: (backdrop: string) => void;
    setPoster: (poster: string) => void;
    setPortrait: (portrait: string) => void;
    setLogo: (logo: string | null) => void;
    setTmdbId: (tmdbId: number) => void;
}

interface EditMediaProps {
    mediaId: string;
    backdropBlur: string;
    open: boolean;
    onClose: () => void;
}

const defaultState: GetMediaSchema = {
    id: '',
    name: '',
    backdrop: '',
    poster: '',
    portrait: '',
    logo: null,
    tmdbId: 0,
    type: MediaType.MOVIE,
    fileName: '',
};

const defaultImages: FrontImagesSchema = {
    backdrops: [],
    posters: [],
    logos: [],
    portraits: [],
};

const EditMediaContext = createContext<EditMediaContext>({
    episodes: [],
    media: defaultState,
    images: defaultImages,
    setName: () => {},
    setBackdrop: () => {},
    setPoster: () => {},
    setPortrait: () => {},
    setLogo: () => {},
    setTmdbId: () => {},
});

function useEditMediaContext () {
    const context = useContext(EditMediaContext);

    if (!context) {
        throw new Error('useEditMediaContext must be used within a PlaylistProvider');
    }

    return context;
}

function ManageEpisode ({ episode }: { episode: EpisodeFileSchema }) {
    const { media } = useEditMediaContext();
    const [episodeNumber, setEpisodeNumber] = useState(String(episode.episode));
    const [seasonNumber, setSeasonNumber] = useState(String(episode.season));
    const handleInputChange = useCallback((handler: (value: string) => void) => (e: ChangeEvent<HTMLInputElement>) => handler(e.target.value), []);
    const trimmedLabel = useMemo(() => episode.fileName.length > 55 ? `${episode.fileName.slice(0, 55)}...` : episode.fileName, [episode.fileName]);

    return (
        <Segment.Container className={'mb-2'}>
            <Segment>
                <span className={'line-clamp-1'}>
                    {trimmedLabel}
                </span>
            </Segment>
            <Segment isLast>
                <div className={'w-full h-full text-sm flex items-center justify-between text-nowrap line-clamp-1'}>
                    <span className={'w-2/3'}>
                        {media.name} S{(seasonNumber.padStart(2, '0'))}E{(episodeNumber.padStart(2, '0'))}
                    </span>
                    <div
                        className={'flex h-full items-center gap-x-4'}
                    >
                        <input
                            type={'number'}
                            value={seasonNumber}
                            onChange={handleInputChange(setSeasonNumber)}
                            className={'bg-transparent text-lightest/100 w-12 h-8 text-center border border-lightL/70 rounded-lg pr-2'}
                        />
                        <input
                            type={'number'}
                            value={episodeNumber}
                            onChange={handleInputChange(setEpisodeNumber)}
                            className={'bg-transparent text-lightest/100 w-12 h-8 text-center border border-lightL/70 rounded-lg pr-2'}
                        />
                    </div>
                </div>
            </Segment>
        </Segment.Container>
    );
}

function EditMediaGeneral () {
    const { createDialog } = useDialogActions();
    const { navigate } = useRouter();
    const { media, setName, setTmdbId: manageTmdbId } = useEditMediaContext();
    const { mutate: getTmdbId } = useMutation(libraryMutations.getTmdbId(media.type));
    const { mutate: deleteMedia } = useMutation(libraryMutations.deleteMedia);
    const { mutate: scanEpisodesInShow } = useMutation(libraryMutations.scanEpisodesInShow(media.name));
    const [tmdbId, setTmdbId] = useState(String(media.tmdbId));

    const handleBlur = useCallback((tmdbId: string) => {
        getTmdbId(tmdbId, {
            onSuccess: (data) => createDialog({
                title: 'Modify TmDB Id?',
                content: `Are you sure you want to modify the media from ${media.name} to ${data.name} released in ${data.year} this would change all info about this media`,
                acceptAction: {
                    label: 'Decline',
                },
                declineAction: {
                    label: 'Accept',
                    isDestructive: true,
                    onClick: () => manageTmdbId(Number(tmdbId)),
                },
            }),
        });
    }, [createDialog, getTmdbId, manageTmdbId, media.name]);

    const scanEpisodes = useCallback(() => scanEpisodesInShow(media.id), [media.id, scanEpisodesInShow]);

    const performDelete = useCallback(() => {
        createDialog({
            title: `Delete ${media.name}`,
            content: `Are you sure you want to delete ${media.name}? This action cannot be undone.`,
            acceptAction: {
                label: 'Cancel',
                light: true,
            },
            declineAction: {
                label: 'Delete',
                isDestructive: true,
                onClick: () => deleteMedia(media.id, {
                    onSuccess: async () => {
                        notify({
                            title: `Deleted ${media.name}`,
                            content: `${media.name} has been deleted`,
                            browserId: 'deleted-media',
                        });
                        await navigate({
                            to: media.type === MediaType.MOVIE ? '/movies' : '/shows',
                            search: {
                                genres: [],
                                decade: 0,
                            },
                        });
                    },
                    onError: () => notify({
                        title: `Failed to delete ${media.name}`,
                        content: `Failed to delete ${media.name}, please try again later`,
                        browserId: 'failed-delete-media',
                    }),
                }),
            },
        });
    }, [createDialog, deleteMedia, media.id, media.name, media.type, navigate]);

    return (
        <div className={'flex flex-col justify-start w-full h-full overflow-hidden overflow-y-scroll scrollbar-hide gap-y-8 px-4'}>
            <BaseSection
                label={'General'}
                settings={
                    [
                        {
                            label: 'Name',
                            rightElement: <TransformingInput
                                iconClassName={'text-lightest/50 ml-1 w-3 h-3 mr-2'}
                                className={'text-lightest text-lg'}
                                onChange={setName}
                                value={media.name}
                                element={'input'}
                                iconLeft
                            />,
                        },
                        {
                            label: `${media.type === MediaType.MOVIE ? 'File' : 'Folder'} name`,
                            rightElement: <span className={'text-lightest text-lg line-clamp-1 max-w-[60%]'}>{media.fileName}</span>,
                        },
                    ]
                }
            />
            <BaseSection
                description={'Deleting the media will remove all information about the media from the database but also the underlying media files from the storage. This action cannot be undone.'}
                settings={
                    [
                        {
                            label: 'Scan Episodes',
                            hide: media.type === MediaType.MOVIE,
                            rightElement: (
                                <RoundedButton
                                    title={'Scan Episodes'}
                                    className={'bg-lightest/20 p-2 hover:bg-lightest/30'}
                                    onClick={scanEpisodes}
                                >
                                    <HiOutlineDocumentSearch className={'w-4 h-4'} />
                                </RoundedButton>
                            ),
                        },
                        {
                            label: 'Delete Media',
                            rightElement: (
                                <RoundedButton
                                    destructive
                                    title={'Delete Media'}
                                    className={'bg-lightest/20 hover:bg-lightest/30 p-2 text-sm hover:shadow-md m-0'}
                                    onClick={performDelete}
                                >
                                    <HiOutlineTrash className={'w-4 h-4'} />
                                </RoundedButton>
                            ),
                        },
                    ]
                }
            />
            <BaseSection
                description={'The Tmdb Id is used to fetch the media details from Tmdb. Modifying this value will update information about the media on all screens.'}
                settings={
                    [
                        {
                            label: 'Tmdb Id',
                            rightElement: <TransformingInput
                                className={'text-lightest text-lg'}
                                iconClassName={'text-lightest/50 mr-2'}
                                onChange={setTmdbId}
                                onBlur={handleBlur}
                                element={'input'}
                                value={tmdbId}
                                iconLeft
                            />,
                        },
                    ]
                }
            />
        </div>
    );
}

function EditMediaImages () {
    const { media, images, setPoster, setLogo, setBackdrop, setPortrait } = useEditMediaContext();

    return (
        <EditImages
            poster={media.poster}
            backdrop={media.backdrop}
            portrait={media.portrait}
            logo={media.logo}
            images={images}
            setPoster={setPoster}
            setBackdrop={setBackdrop}
            setPortrait={setPortrait}
            setLogo={setLogo}
        />
    );
}

function EditEpisodes () {
    const { episodes } = useEditMediaContext();

    return (
        <Segment.Section>
            <Segment.Label label={'Episodes'} />
            <Segment.FlexWrapper className={'overflow-hidden'}>
                <div className={'max-h-full scrollbar-hide overflow-y-scroll'}>
                    {
                        sortBy(episodes, ['season', 'episode'], ['asc', 'asc']).map((episode) => (
                            <ManageEpisode key={episode.episodeId} episode={episode} />
                        ))
                    }
                </div>
                <Segment.Description
                    description={'You can manage the episodes of this media here. Changing the season or episode number will update the episode in the database.'}
                />
            </Segment.FlexWrapper>
        </Segment.Section>

    );
}

function EditPermissions () {
    const { media } = useEditMediaContext();

    return (
        <BaseSection
            label={'Permissions'}
            settings={[]}
            addItem={
                {
                    label: 'Create New Media Group',
                    startValue: `${media.name} Group`,
                    onCreate: console.log,
                }
            }
        />
    );
}

function EditMedia () {
    const { media } = useEditMediaContext();

    const tabs = useMemo(() => {
        const tabs = [
            EditMediaTabs.General,
            EditMediaTabs.Images,
            EditMediaTabs.Episodes,
            EditMediaTabs.Permissions,
        ];

        if (media.type === MediaType.MOVIE) {
            tabs.splice(2, 1);
        }

        return tabs;
    }, [media.type]);

    return (
        <DisplayLoader loading={media.backdrop === ''}>
            <LazyImage
                src={media.backdrop}
                alt={media.name}
                className={'absolute inset-0 object-cover w-full h-full opacity-5'}
            />
            <div className={'flex items-center text-2xl font-bold justify-center w-full h-full space-x-4'}>
                <TabsHolder
                    vertical
                    tabs={tabs}
                    activeLiClassName={'text-lightest/100'}
                    liClassName={'text-lightest/60 hover:text-lightest/100'}
                    wrapperClassName={'h-full w-full flex items-start justify-between'}
                    holderClassName={'flex items-start justify-between h-full border-r-2 border-lightest/20'}
                    ulClassName={'h-full justify-center text-lg font-medium gap-y-4 px-8'}
                    underlineClassName={'relative w-[2px] bg-lightest/100'}
                    components={
                        [
                            {
                                activeWhen: [EditMediaTabs.General],
                                component: <EditMediaGeneral />,
                            },
                            {
                                activeWhen: [EditMediaTabs.Images],
                                component: <EditMediaImages />,
                            },
                            {
                                activeWhen: [EditMediaTabs.Episodes],
                                component: <EditEpisodes />,
                            },
                            {
                                activeWhen: [EditMediaTabs.Permissions],
                                component: <EditPermissions />,
                            },
                        ]
                    }
                />
            </div>
        </DisplayLoader>
    );
}

export function EditMediaDetail ({ mediaId, backdropBlur, open, onClose }: EditMediaProps) {
    const [editMedia, setEditMedia] = useAutoSaveAction({
        delay: 2000,
        options: mediaActions.editMedia(mediaId, defaultState),
    });

    const { data: images } = useQuery(mediaQueries.images(editMedia.tmdbId, editMedia.type));
    const { data: episodes } = useQuery(mediaQueries.episodes(editMedia.id, editMedia.type));

    const setName = useCallback((name: string) => setEditMedia((prev) => ({
        ...prev,
        name,
    })), [setEditMedia]);

    const setBackdrop = useCallback((backdrop: string) => setEditMedia((prev) => ({
        ...prev,
        backdrop,
    })), [setEditMedia]);

    const setPoster = useCallback((poster: string) => setEditMedia((prev) => ({
        ...prev,
        poster,
    })), [setEditMedia]);

    const setPortrait = useCallback((portrait: string) => setEditMedia((prev) => ({
        ...prev,
        portrait,
    })), [setEditMedia]);

    const setLogo = useCallback((logo: string | null) => setEditMedia((prev) => ({
        ...prev,
        logo,
    })), [setEditMedia]);

    const setTmdbId = useCallback((tmdbId: number) => setEditMedia((prev) => ({
        ...prev,
        tmdbId,
    })), [setEditMedia]);

    return (
        <EditMediaContext.Provider
            value={
                {
                    media: editMedia,
                    images,
                    setName,
                    setBackdrop,
                    setPoster,
                    setPortrait,
                    setLogo,
                    setTmdbId,
                    episodes,
                }
            }
        >
            <Modal
                open={open}
                onClose={onClose}
                style={createStyles(backdropBlur, [5], true)}
                className={'flex flex-col overflow-clip items-center justify-start w-3/5 imacPro:w-2/5 h-2/3 px-4 py-8 bg-dark-500/90 backdrop-blur-lg rounded-xl border-2 border-lightest shadow-black shadow-lg'}
            >
                <EditMedia />
            </Modal>
        </EditMediaContext.Provider>
    );
}
