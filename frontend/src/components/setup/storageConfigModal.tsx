import { OauthProvider, MediaType, FramesFileSchema } from '@/api/data-contracts';
import { BaseButton, PrimaryButton } from '@/components/button';
import { Modal } from '@/components/modal';
import { MultiSelectItem, MultiSelect } from '@/components/multiSelect';
import { InputGroup, ObjectToItemArray } from '@/components/setup/input';
import { useSetupActions, useSetupState, OauthDetails } from '@/providers/setupProvider';
import { setupQueries } from '@/queries/setup';
import { createStyles } from '@/utils/colour';
import { tw } from '@/utils/style';

import { sortBy, dedupeBy } from '@eleven-am/fp';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { FaChevronRight } from 'react-icons/fa';
import { FaRegFile } from 'react-icons/fa6';
import { FiFilm } from 'react-icons/fi';
import { LuFolder } from 'react-icons/lu';
import { MdHome } from 'react-icons/md';
import { PiTelevision } from 'react-icons/pi';


type TinyPath = {
    name: string;
    path: string;
}

interface ConfigurationProps<T extends Record<string, string>> {
    label: string;
    description: string;
    inputs: ObjectToItemArray<T>;
    handleSubmit: (value: T) => Promise<void>;
}

interface SelectLocationTypeProps {
    movies: TinyPath[];
    shows: TinyPath[];
    setMovies: (value: TinyPath[]) => void;
    setShows: (value: TinyPath[]) => void;
    onSelect: (type: MediaType | null) => void;
    saveAndExit: () => void;
}

interface FileBrowserModalProps<T extends Record<string, string>> {
    open: boolean;
    label: string;
    onClose: () => void;
    description: string;
    defaultPath?: string;
    inputs: ObjectToItemArray<T>;
    handleSubmit: (value: T) => Promise<string | void>;
}

interface StorageBrowserProps {
    storageId: string;
    path: string | null;
    handleConfigured: (movies: string[], shows: string[]) => void;
}

interface FileBrowserProps {
    storageId: string;
    type: MediaType;
    path: string | null;
    addMedia: (value: TinyPath) => void;
    setLibraryType: (type: MediaType | null) => void;
}

interface BreadCrumbsProps {
    folders: TinyPath[];
    setPath: (path: string) => void;
}

type S3Details = {
    access_key: string;
    secret_key: string;
    bucket_name: string;
    region: string;
    endpoint: string;
}

const baseClass = 'text-white disabled:cursor-not-allowed disabled:pointer-events-none w-full focus:ring-0 focus:outline-none font-medium rounded-lg text-sm macbook:text-xl px-5 py-2.5 text-center inline-flex items-center justify-center my-2 shadow-black/70 shadow-sm hover:shadow-md hover:shadow-black/80 transition-all duration-200 ease-in-out';

function ConfigureComponent<T extends Record<string, string>> ({ label, description, inputs, handleSubmit }: ConfigurationProps<T>) {
    return (
        <div
            className={'w-full h-full flex flex-col items-center justify-center gap-y-4'}
        >
            <div
                className={'w-96'}
            >
                <InputGroup
                    label={label}
                    noAnimationOnEnter
                    handleSubmit={handleSubmit}
                    description={description}
                    inputs={inputs}
                />
            </div>
        </div>
    );
}

function SelectLocationType ({ onSelect, saveAndExit, movies, shows, setMovies, setShows }: SelectLocationTypeProps) {
    const handleOnClick = useCallback((type: MediaType) => () => onSelect(type), [onSelect]);
    const hasBeenConfigured = useMemo(() => [...movies, ...shows].length > 0, [movies, shows]);

    const moviesMultiSelect = useMemo((): MultiSelectItem<TinyPath>[] => movies.map((movie, index) => ({
        id: index.toString(),
        label: movie.name,
        value: movie,
    })), [movies]);

    const showsMultiSelect = useMemo((): MultiSelectItem<TinyPath>[] => shows.map((show, index) => ({
        id: index.toString(),
        label: show.name,
        value: show,
    })), [shows]);

    const handleMoviesSelected = useCallback((item: MultiSelectItem<TinyPath>) => setMovies(movies
        .filter((movie) => movie.path !== item.value.path)), [movies, setMovies]);

    const handleShowsSelected = useCallback((item: MultiSelectItem<TinyPath>) => setShows(shows
        .filter((show) => show.path !== item.value.path)), [shows, setShows]);

    return (
        <div
            className={'w-full overflow-hidden flex flex-col items-center justify-center gap-y-4'}
            style={createStyles('34, 93, 144', [3, 4], true)}
        >
            <BaseButton
                type={'button'}
                title={'Select Movie Library'}
                onClick={handleOnClick(MediaType.MOVIE)}
                className={tw(baseClass, 'w-80 bg-dark-400 hover:bg-dark-300 disabled:text-lightL disabled:bg-dark-400')}
            >
                <FiFilm className={'w-6 h-6 mr-2'} />
                <span>select movie library</span>
            </BaseButton>
            {
                movies.length > 0 && (
                    <div className={'w-fit max-w-full overflow-hidden'}>
                        <MultiSelect
                            tags
                            items={moviesMultiSelect}
                            selectedItems={[]}
                            mobileLabel={'Movie Libraries'}
                            handleItemSelected={handleMoviesSelected}
                        />
                    </div>
                )
            }
            <BaseButton
                type={'button'}
                title={'Select Show Library'}
                onClick={handleOnClick(MediaType.SHOW)}
                className={tw(baseClass, 'w-80 bg-dark-400 hover:bg-dark-300 disabled:text-lightL disabled:bg-dark-400')}
            >
                <PiTelevision className={'w-6 h-6 mr-2'} />
                <span>select show library</span>
            </BaseButton>
            {
                shows.length > 0 && (
                    <div className={'w-fit max-w-full overflow-hidden'}>
                        <MultiSelect
                            tags
                            items={showsMultiSelect}
                            selectedItems={[]}
                            mobileLabel={'Show Libraries'}
                            handleItemSelected={handleShowsSelected}
                        />
                    </div>
                )
            }
            {
                hasBeenConfigured && (
                    <BaseButton
                        type={'button'}
                        onClick={saveAndExit}
                        title={'Save and Exit'}
                        style={createStyles('144, 49, 34', [3, 4], true)}
                        className={tw(baseClass, 'w-80 bg-dark-400 hover:bg-dark-300 disabled:text-lightL disabled:bg-dark-400')}
                    >
                        <span>save and exit</span>
                    </BaseButton>
                )
            }
        </div>
    );
}

function BreadCrumbs ({ folders, setPath }: BreadCrumbsProps) {
    const handleOnClick = useCallback((folder: TinyPath) => () => setPath(folder.path), [setPath]);

    return (
        <ul className={'w-full h-full overflow-hidden flex flex-row items-center justify-start gap-x-4'}>
            {
                folders.map((folder, index) => (
                    <>
                        <li
                            key={folder.path}
                            onClick={handleOnClick(folder)}
                            className={
                                tw('flex flex-row items-center justify-start space-x-2 cursor-pointer text-lightest/50', {
                                    'hover:text-lightest': index !== folders.length - 1,
                                    'hover:text-lightest/80': index === folders.length - 1,
                                    'text-lightest': index === folders.length - 1,
                                })
                            }
                        >
                            {
                                index === 0
                                    ? <MdHome className={'w-6 h-6'} />
                                    : <FaChevronRight className={'w-3 h-3 mr-2 text-lightest/50'} />
                            }
                            <span>{folder.name}</span>
                        </li>
                    </>
                ))
            }
        </ul>
    );
}

function FileBrowser ({ storageId, setLibraryType, addMedia, type, path: oldPath }: FileBrowserProps) {
    const [path, setPath] = useState<string | null>(oldPath);
    const { data } = useQuery(setupQueries.readFolder(path, storageId));
    const items = useMemo(() => sortBy(data?.items ?? [], ['isFolder', 'name'], ['desc', 'asc']), [data]);
    const handleOnClick = useCallback((item: FramesFileSchema) => () => item.isFolder && setPath(item.path), [setPath]);

    const folder = useMemo(() => {
        if (!data) {
            return {
                name: 'Home',
                path: oldPath ?? '',
            };
        }

        return {
            name: data.name,
            path: data.path,
        };
    }, [data, oldPath]);

    const [folders, setFolders] = useState<TinyPath[]>([folder]);
    const cancel = useCallback(() => setLibraryType(null), [setLibraryType]);

    const selectFolder = useCallback(() => {
        addMedia({
            path: folder.path,
            name: `/${folders.map((f) => f.name).join('/')}`,
        });
    }, [addMedia, folder.path, folders]);

    useEffect(() => {
        if (!data) {
            return;
        }

        setFolders(
            (prev) => {
                const findIndex = prev.findIndex((f) => f.path === folder.path);

                if (findIndex === -1) {
                    return dedupeBy([...prev, folder], 'path');
                }

                return prev.slice(0, findIndex + 1);
            },
        );
    }, [data, folder]);

    if (!data || (data?.path !== path && path !== null)) {
        return (
            <div className={'loader text-lightM'} />
        );
    }

    return (
        <div className={'w-full h-full flex flex-col items-center p-1 justify-start gap-y-2'}>
            <div className={'w-full h-12 flex items-center justify-center'}>
                <BreadCrumbs folders={folders} setPath={setPath} />
            </div>
            <div
                className={'w-full grow border-lightest/20 border rounded-lg overflow-hidden overflow-y-scroll scrollbar-hide py-2'}
            >
                <div
                    className={'w-full grid grid-cols-6 gap-y-4 gap-x-4'}
                >
                    {
                        items.map((item) => (
                            <div
                                key={item.path}
                                onClick={handleOnClick(item)}
                                className={
                                    tw('overflow-hidden flex flex-col items-center justify-center gap-y-2 cursor-pointer p-2', {
                                        'text-lightest/70 hover:text-lightest': item.isFolder,
                                        'text-lightest/25 cursor-default': !item.isFolder,
                                    })
                                }
                            >
                                {item.isFolder ? <LuFolder className={'w-12 h-12'} /> : <FaRegFile className={'w-12 h-12'} />}
                                <span className={'mx-2 text-nowrap text-center text-ellipsis w-full'}>
                                    {item.name}
                                </span>
                            </div>
                        ))
                    }
                </div>
            </div>
            <div
                style={createStyles('34, 93, 144')}
                className={'w-full flex items-center gap-x-4 py-2 justify-end'}
            >
                <PrimaryButton
                    light
                    onClick={selectFolder}
                    label={`select ${type === MediaType.MOVIE ? 'movie' : 'show'} folder`}
                    className={'py-2 px-4 rounded-md text-sm bg-light-900 hover:bg-light-800'}
                />
                <PrimaryButton
                    label={'Cancel'}
                    onClick={cancel}
                    className={'py-2 px-4 rounded-md text-sm'}
                />
            </div>
        </div>
    );
}

function StorageBrowser ({ storageId, handleConfigured, path }: StorageBrowserProps) {
    const [libraryType, setLibraryType] = useState<MediaType | null>(null);
    const [movies, setMovies] = useState<TinyPath[]>([]);
    const [shows, setShows] = useState<TinyPath[]>([]);

    const saveAndExit = useCallback(() => handleConfigured(movies.map((movie) => movie.path), shows.map((show) => show.path)), [handleConfigured, movies, shows]);

    const addMedia = useCallback((value: TinyPath) => {
        if (libraryType === MediaType.MOVIE) {
            setMovies((prevState) => dedupeBy([...prevState, value], 'path'));
        } else if (libraryType === MediaType.SHOW) {
            setShows((prevState) => dedupeBy([...prevState, value], 'path'));
        }

        setLibraryType(null);
    }, [libraryType]);

    return (
        <div className={'w-full h-full flex flex-col items-center justify-center'}>
            {
                libraryType === null
                    ? <SelectLocationType onSelect={setLibraryType} movies={movies} shows={shows} setMovies={setMovies} setShows={setShows} saveAndExit={saveAndExit} />
                    : <FileBrowser storageId={storageId} addMedia={addMedia} setLibraryType={setLibraryType} type={libraryType} path={path} />
            }
        </div>
    );
}

function FileBrowserModal<T extends Record<string, string>> ({ open, onClose, label, description, inputs, handleSubmit, defaultPath }: FileBrowserModalProps<T>) {
    const [storageId, setStorageId] = useState('');
    const { updateStorage } = useSetupActions();

    const handleConfigure = useCallback(async (value: T) => {
        const id = await handleSubmit(value);

        if (typeof id === 'string') {
            setStorageId(id);
        }
    }, [handleSubmit]);

    const handleConfigured = useCallback(async (movies: string[], shows: string[]) => {
        await updateStorage(storageId, movies, shows);
        onClose();
        setStorageId('');
    }, [onClose, storageId, updateStorage]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            className={'flex flex-col items-center justify-start w-2/3 h-4/5 p-4 space-y-4 bg-darkD/60 backdrop-blur-lg rounded-xl border-2 border-lightest shadow-black shadow-lg'}
        >
            {
                storageId !== ''
                    ? (
                        <StorageBrowser
                            storageId={storageId}
                            path={defaultPath || null}
                            handleConfigured={handleConfigured}
                        />
                    )
                    : (
                        <ConfigureComponent
                            label={label}
                            description={description}
                            inputs={inputs}
                            handleSubmit={handleConfigure}
                        />
                    )
            }
        </Modal>
    );
}

export function StorageConfigModal () {
    const [localPath, setLocalPath] = useState<string | undefined>(undefined);
    const { driveModal, dropboxModal, localModal, s3Modal } = useSetupState();
    const { closeDriveModal, closeDropboxModal, closeS3Modal, closeLocalModal, authenticateOauth, authenticateLocal } = useSetupActions();
    const manageOauth = useCallback((provider: OauthProvider) => (value: OauthDetails) => authenticateOauth(value, provider), [authenticateOauth]);

    const manageLocal = useCallback((value: TinyPath) => {
        setLocalPath(value.path);

        return authenticateLocal(value.name);
    }, [authenticateLocal]);

    return (
        <>
            <FileBrowserModal<OauthDetails>
                open={driveModal}
                onClose={closeDriveModal}
                label={'Configure Google Drive'}
                handleSubmit={manageOauth(OauthProvider.DRIVE)}
                description={'Please provide the necessary information to configure Google Drive. These information can be obtained from the Google Cloud Console.'}
                inputs={
                    [
                        {
                            placeholder: 'Service Name',
                            name: 'name',
                        },
                        {
                            placeholder: 'Client ID',
                            name: 'client_id',
                        },
                        {
                            placeholder: 'Client Secret',
                            name: 'client_secret',
                        },
                    ]
                }
            />
            <FileBrowserModal<OauthDetails>
                open={dropboxModal}
                onClose={closeDropboxModal}
                label={'Configure Dropbox'}
                handleSubmit={manageOauth(OauthProvider.DROPBOX)}
                description={'Please provide the necessary information to configure Dropbox. These information can be obtained from the Dropbox Developer Console.'}
                inputs={
                    [
                        {
                            placeholder: 'Service Name',
                            name: 'name',
                        },
                        {
                            placeholder: 'Client ID',
                            name: 'client_id',
                        },
                        {
                            placeholder: 'Client Secret',
                            name: 'client_secret',
                        },
                    ]
                }
            />
            <FileBrowserModal<S3Details>
                open={s3Modal}
                onClose={closeS3Modal}
                label={'Configure S3'}
                handleSubmit={Promise.resolve}
                description={'Please provide the necessary information to configure S3. These information can be obtained from the AWS Console or any other S3 compatible service.'}
                inputs={
                    [
                        {
                            placeholder: 'Access Key',
                            name: 'access_key',
                        },
                        {
                            placeholder: 'Secret Key',
                            name: 'secret_key',
                        },
                        {
                            placeholder: 'Bucket Name',
                            name: 'bucket_name',
                        },
                        {
                            placeholder: 'Region',
                            name: 'region',
                        },
                        {
                            placeholder: 'Endpoint',
                            name: 'endpoint',
                        },
                    ]
                }
            />
            <FileBrowserModal<TinyPath>
                open={localModal}
                onClose={closeLocalModal}
                label={'Configure Local Storage'}
                handleSubmit={manageLocal}
                defaultPath={localPath}
                description={'Please provide the necessary information to configure Local Storage. Some OS\' do not allow access to certain directories.'}
                inputs={
                    [
                        {
                            placeholder: 'Service Name',
                            name: 'name',
                        },
                        {
                            placeholder: 'Path to location on disk',
                            name: 'path',
                        },
                    ]
                }
            />
        </>
    );
}
