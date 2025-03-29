import { UnScannedItemSchema, MediaType, CreateMediaArgs } from '@/api/data-contracts';
import { AuthButton } from '@/components/auth/buttons';
import { EditImages } from '@/components/editImages';
import { TransformingInput } from '@/components/input';
import { LazyImage } from '@/components/lazyImage';
import { DisplayLoader } from '@/components/loading-set/Loading';
import { Modal } from '@/components/modal';
import { BaseSection } from '@/components/settingsUI/baseSections';
import { Segment } from '@/components/settingsUI/segments';
import { TabsHolder } from '@/components/tabs';
import { useDialogActions } from '@/providers/dialogStore';
import { mediaQueries } from '@/queries/media';
import { libraryMutations } from '@/queries/settings/libraries';
import { createStyles } from '@/utils/colour';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';


enum EditLibraryTabs {
    General = 'General',
    Images = 'Images',
    Recap = 'Recap',
}

interface EditLibraryProps {
    media: UnScannedItemSchema;
    onClosed: () => void;
    onSaved: () => void;
    isOpen: boolean;
}

interface EditGeneralProps {
    media: UnScannedItemSchema;
    name: string;
    tmdbId: number;
    setTmdbId: (value: string) => void;
    setName: (value: string) => void;
    setIsLoading: (value: boolean) => void;
    onSaved: () => void;
}

interface EditRecapProps {
    name: string;
    tmbId: number;
    filename: string;
    storageId: string;
    filepath: string;
    logo: string | null;
    poster: string | null;
    backdrop: string | null;
    portrait: string | null;
    onSaved: () => void;
    mediaType: MediaType;
}

function ImageDetails ({ image, label }: { image: string | null, label: string }) {
    return (
        <div className={'w-1/2 h-full flex flex-col items-center justify-center'}>
            <LazyImage
                src={image || ''}
                alt={label}
                className={'h-4/5 w-auto object-contain rounded-md'}
            />
            <span className={'text-lightest text-md'}>{label}</span>
        </div>
    );
}

function EditGeneral ({ media, name, tmdbId, setTmdbId, setName, onSaved, setIsLoading }: EditGeneralProps) {
    const { mutate: createFromTmdbId } = useMutation(libraryMutations.createFromTmdbId(media.storageId, onSaved, setIsLoading));
    const { mutate: getTmdbId } = useMutation(libraryMutations.getTmdbId(media.type));
    const { createDialog } = useDialogActions();

    const handleBlur = useCallback((tmdbId: string) => {
        getTmdbId(tmdbId, {
            onSuccess: (data) => createDialog({
                title: 'Create from Tmdb Id',
                content: `Would you like to assign the media ${media.name} to ${data.name} released in ${data.year}?`,
                declineAction: {
                    label: 'Decline',
                },
                acceptAction: {
                    label: 'Accept',
                    onClick: () => {
                        setIsLoading(true);
                        createFromTmdbId({
                            storageId: media.storageId,
                            tmdbId: data.tmdbId,
                            filepath: media.filepath,
                            type: media.type,
                        });
                    },
                },
            }),
        });
    }, [getTmdbId, createDialog, media.name, media.storageId, media.filepath, media.type, setIsLoading, createFromTmdbId]);

    return (
        <div className={'flex flex-col justify-start w-full h-full overflow-hidden overflow-y-scroll scrollbar-hide gap-y-8 px-4'}>
            <BaseSection
                label={'General'}
                settings={
                    [
                        {
                            label: 'Name',
                            rightElement: <TransformingInput
                                iconLeft
                                value={name}
                                element={'input'}
                                onChange={setName}
                                className={'text-lightest text-lg'}
                                iconClassName={'text-lightest/50 mr-1 w-3 h-3'}
                            />,
                        },
                        {
                            label: `${media.type === MediaType.MOVIE ? 'File' : 'Folder'} name`,
                            rightElement: <span className={'text-lightest text-lg line-clamp-1 max-w-[60%]'}>{media.filename}</span>,
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
                                iconClassName={'text-lightest/50 mr-2'}
                                className={'text-lightest text-lg'}
                                value={tmdbId.toString()}
                                onChange={setTmdbId}
                                onBlur={handleBlur}
                                element={'input'}
                                iconLeft
                            />,
                        },
                    ]
                }
            />
        </div>
    );
}

function EditRecap ({ name, mediaType, tmbId, filename, logo, poster, backdrop, portrait, storageId, filepath, onSaved }: EditRecapProps) {
    const { mutate } = useMutation(libraryMutations.createNewMedia(storageId, onSaved));

    const params = useMemo((): CreateMediaArgs => ({
        tmdbId: tmbId,
        type: mediaType,
        poster: poster || '',
        backdrop: backdrop || '',
        portrait: portrait || '',
        logo: logo || '',
        storageId,
        filepath,
    }), [backdrop, filepath, logo, mediaType, portrait, poster, storageId, tmbId]);

    const handleClick = useCallback(() => mutate(params), [mutate, params]);

    return (
        <div className={'flex flex-col justify-start w-full h-full overflow-hidden overflow-y-scroll scrollbar-hide gap-y-8 px-4'}>
            <BaseSection
                label={'Details'}
                settings={
                    [
                        {
                            label: 'Name',
                            rightElement: <span className={'text-lightest text-lg'}>{name}</span>,
                        },
                        {
                            label: 'Tmdb Id',
                            rightElement: <span className={'text-lightest text-lg'}>{tmbId}</span>,
                        },
                        {
                            label: 'File name',
                            rightElement: <span className={'text-lightest text-lg'}>{filename}</span>,
                        },
                    ]
                }
            />
            <Segment.Section>
                <Segment.FlexWrapper>
                    <Segment.Container>
                        <div className={'flex flex-col gap-y-1 justify-center items-center p-4 h-80 w-full bg-lightL/20'}>
                            <div className={'flex items-center justify-center h-1/2 w-full'}>
                                <ImageDetails image={logo} label={'Logo'} />
                                <ImageDetails image={poster} label={'Poster'} />
                            </div>
                            <div className={'flex items-center justify-center h-1/2 w-full'}>
                                <ImageDetails image={backdrop} label={'Backdrop'} />
                                <ImageDetails image={portrait} label={'Portrait'} />
                            </div>
                        </div>
                    </Segment.Container>
                </Segment.FlexWrapper>
            </Segment.Section>
            <AuthButton
                type={'button'}
                label={'Save the changes'}
                tooltip={'Save the changes'}
                handleClick={handleClick}
                disabled={poster === null || backdrop === null || portrait === null || tmbId < 1}
                className={'my-0 bg-darkM hover:bg-darkM/90 disabled:text-lightL disabled:bg-darkL/75'}
            />
        </div>
    );
}

export function EditLibrary ({ media, onClosed, isOpen, onSaved }: EditLibraryProps) {
    const [name, setName] = useState(media.name);
    const [backdrop, setBackdrop] = useState<string | null>(null);
    const [poster, setPoster] = useState<string | null>(media.poster);
    const [portrait, setPortrait] = useState<string | null>(null);
    const [logo, setLogo] = useState<string | null>(null);
    const [tmdbId, setTmdbId] = useState(media.tmdbId);
    const { data: images } = useQuery(mediaQueries.images(tmdbId, media.type));
    const [isLoading, setIsLoading] = useState(false);

    const handleTmdbUpdate = useCallback((value: string) => {
        const tmdbId = parseInt(value, 10);
        if (!isNaN(tmdbId) && tmdbId > 0) {
            setTmdbId(tmdbId);
        }
    }, []);

    return (
        <Modal
            open={isOpen}
            onClose={onClosed}
            style={createStyles(media.posterBlur || '0,0,0', [5], true)}
            className={'flex flex-col overflow-clip items-center justify-start w-3/5 imacPro:w-2/5 h-2/3 px-4 py-8 bg-dark-500/90 backdrop-blur-lg rounded-xl border-2 border-lightest shadow-black shadow-lg'}
        >
            <DisplayLoader loading={isLoading}>
                <LazyImage
                    src={backdrop || poster || ''}
                    alt={media.name}
                    className={'absolute inset-0 object-cover w-full h-full opacity-5'}
                />
                <div className={'flex items-center text-2xl font-bold justify-center w-full h-full space-x-4'}>
                    <TabsHolder
                        vertical
                        tabs={[EditLibraryTabs.General, EditLibraryTabs.Images, EditLibraryTabs.Recap]}
                        activeLiClassName={'text-lightest/100'}
                        liClassName={'text-lightest/60 hover:text-lightest/100'}
                        wrapperClassName={'h-full w-full flex items-start justify-between'}
                        holderClassName={'flex items-start justify-between h-full border-r-2 border-lightest/20'}
                        ulClassName={'h-full justify-center text-lg font-medium gap-y-4 px-8'}
                        underlineClassName={'relative w-[2px] bg-lightest/100'}
                        components={
                            [
                                {
                                    activeWhen: [EditLibraryTabs.General],
                                    component: <EditGeneral
                                        media={media}
                                        name={name}
                                        tmdbId={tmdbId}
                                        setName={setName}
                                        onSaved={onSaved}
                                        setIsLoading={setIsLoading}
                                        setTmdbId={handleTmdbUpdate}
                                    />,
                                },
                                {
                                    activeWhen: [EditLibraryTabs.Images],
                                    component: <EditImages
                                        logo={logo}
                                        poster={poster}
                                        backdrop={backdrop}
                                        portrait={portrait}
                                        images={images}
                                        setLogo={setLogo}
                                        setPoster={setPoster}
                                        setBackdrop={setBackdrop}
                                        setPortrait={setPortrait}
                                    />,
                                },
                                {
                                    activeWhen: [EditLibraryTabs.Recap],
                                    component: <EditRecap
                                        name={name}
                                        tmbId={tmdbId}
                                        filename={media.filename}
                                        logo={logo}
                                        poster={poster}
                                        backdrop={backdrop}
                                        portrait={portrait}
                                        storageId={media.storageId}
                                        filepath={media.filepath}
                                        onSaved={onSaved}
                                        mediaType={media.type}
                                    />,
                                },
                            ]
                        }
                    />
                </div>
            </DisplayLoader>
        </Modal>
    );
}
