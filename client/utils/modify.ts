import {Dispatch, SetStateAction, useCallback, useEffect, useState} from "react";
import {atom, selector, useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {FrontImages, tmdbMedia} from "../../server/classes/tmdb";
import {MediaType, PickType} from "@prisma/client";
import {WatchHistory} from "../../server/classes/playback";
import {PickSummary, UpdateSearch} from "../../server/classes/pickAndFrame";
import {MyList, PlaybackSettings} from "../../server/classes/user";
import {EpisodeModSettings, MedForMod, SpringMedia} from "../../server/classes/media";
import {GetContentSearch} from "../../server/classes/springboard";
import {InfoContext} from "../next/components/info/infoContext";
import useBase from "./provider";
import {useConfirmDispatch} from "./notifications";

export type FrontMedia = MedForMod & { location: string }

export const DeleteAndLocationAtom = atom<{ del: boolean, location: string | null, name: string }>({
    key: 'DeleteAndLocationAtom',
    default: {del: false, location: null, name: ''}
})

export const EditModalAtom = atom({
    key: 'mediaId',
    default: false,
});

export const EditFrontMediaAtom = atom<FrontMedia>({
    key: 'frontMedia',
    default: {
        poster: '', backdrop: '',
        mediaId: 0, year: 0, name: '',
        logo: '', location: '', suggestions: [],
        type: MediaType.MOVIE, stateType: 'NONE',
        file: undefined, tmdbId: 0,
    }
});

export const UnsavedFrontMediaAtom = atom<MedForMod[]>({
    key: 'unsavedFrontMedia',
    default: []
})

const ModifyingPick = atom({
    key: 'modifyingPick',
    default: false,
});

export const EditPickContext = atom<PickSummary & { statusType: boolean, process: 'MODIFY' | 'ADD' }>({
    key: 'editFrontPick',
    default: {
        category: '',
        display: '',
        poster: '',
        overview: '',
        type: PickType.EDITOR,
        picks: [],
        active: false,
        process: 'ADD',
        statusType: false,
    }
})

export const PickSearchContext = atom<UpdateSearch[]>({
    key: 'pickSearch',
    default: [],
})

export const PickSelectorContext = selector<UpdateSearch[]>({
    key: 'PickGridSelector',
    get: ({get}) => {
        const search = get(PickSearchContext);
        const pick = get(EditPickContext).picks;
        return search.length ? search : pick;
    }
})

export const SettingsSegmentContext = atom<{ step1: string | null, step2: string | null }>({
    key: 'settingsSegment',
    default: {
        step1: null,
        step2: null,
    }
})

export const GetSearchContext = atom<{ data: GetContentSearch[], loading: boolean }>({
    key: 'GetSearchContext',
    default: {
        data: [],
        loading: true
    },
})

const UserPlaybackSettingsContext = atom<PlaybackSettings | null>({
    key: 'userPlaybackSettings',
    default: null,
})

export const useGetContext = () => {
    const base = useBase();
    const dispatch = useConfirmDispatch();
    const setSearch = useSetRecoilState(GetSearchContext);

    const libraryScan = useCallback(async (id: 'MEDIA' | 'EPISODES') => {
        const path = id.toLowerCase();
        const text = base.capitalize(path);
        dispatch({
            type: "success",
            heading: `${text} download begun`,
            message: `Frames would begin downloading mew ${text} shortly`
        });
        await base.makeRequest(`/api/settings/download?value=${path}`, null);
    }, [base, dispatch]);

    const searchRecommendations = useCallback(async (id: number, type: 'PERSON' | MediaType) => {
        setSearch(prev => ({...prev, loading: true}))
        const data = await base.makeRequest<GetContentSearch[]>(`/api/modify/recommend/${type}?tmdbId=${id}`, null);
        if (data)
            setSearch({data, loading: false});
    }, [base, setSearch]);

    const downloadMedia = useCallback(async (id: number, type: MediaType, libName: string | null, name: string) => {
        if (libName)
            dispatch({
                type: 'warn',
                heading: `${libName} already exists`,
                message: `${name} already exists in the library as ${libName}`
            });

        else {
            const check = await base.makeRequest<boolean>(`/api/modify/download/${type}?tmdbId=${id}`, null);
            if (check)
                dispatch({
                    type: 'success',
                    heading: `${base.capitalize(type)} begun downloading`,
                    message: `${name} has begun downloading`
                });
            else
                dispatch({
                    type: 'error',
                    heading: `${base.capitalize(type)} download failed`,
                    message: `${name} failed to download`
                });
        }
    }, [base, dispatch]);

    const downloadEpisodes = useCallback(async ({id, name}: SpringMedia) => {
        dispatch({
            type: 'success',
            heading: `Media download begun`,
            message: `${name} has begun downloading`
        });
        const check = await base.makeRequest<boolean>(`/api/media/downloadShow?mediaId=${id}`, null);
        if (check)
            dispatch({
                type: 'success',
                heading: `Media download complete`,
                message: `${name} has been downloaded`
            });
        else
            dispatch({
                type: 'error',
                heading: `Download failed`,
                message: `${name} failed to download, something went wrong`
            });
    }, [base, dispatch])

    return {libraryScan, downloadMedia, searchRecommendations, downloadEpisodes}
}

export const useEditorPicks = () => {
    const base = useBase();
    const setInform = useConfirmDispatch();
    const setSearch = useSetRecoilState(PickSearchContext);
    const [state, setState] = useRecoilState(EditPickContext);
    const [modifyingPick, setModifyingPick] = useRecoilState(ModifyingPick);

    const addPick = useCallback(async (cb: () => void) => {
        if (state.picks.length && state.display !== '' && state.category !== '') {
            const pick = {
                category: state.category,
                display: state.display,
                type: state.type,
                picks: state.picks.map(p => p.id),
                active: state.active,
            };
            const check = await base.makeRequest<boolean>('/api/modify/pick', {...pick}, 'POST');
            if (check)
                setInform({
                    type: "success",
                    heading: 'Editor pick added successfully',
                    message: `The editor pick ${state.display}, has been added successfully`
                })
            else setInform({
                type: "warn",
                heading: 'Something went wrong',
                message: `Failed to add the editor pick ${state.display} to the database`
            })
            cb();
        } else
            setInform({
                type: "error",
                heading: 'Missing information',
                message: `Please fill out all the required fields`
            })
    }, [base, state, setInform]);

    const modifyPick = useCallback(async (obj: UpdateSearch) => {
        if (!modifyingPick) {
            setModifyingPick(true);

            if (state.picks.some(m => m.id === obj.id))
                setState(prev => ({...prev, picks: prev.picks.filter(m => m.id !== obj.id)}));

            else
                setState(prev => ({...prev, picks: [...prev.picks, obj]}));

            setSearch([]);
            setModifyingPick(false);
        }
    }, [state, setState, setSearch, modifyingPick, setModifyingPick]);

    const pushPickLib = useCallback(async (obj: PickSummary | null) => {
        if (obj === null)
            setState({
                category: '',
                display: '',
                poster: '',
                overview: '',
                type: PickType.EDITOR,
                picks: [],
                active: false,
                process: 'ADD',
                statusType: true,
            })
        else
            setState({...obj, statusType: true, process: 'MODIFY'});
    }, [setState]);

    return {addPick, modifyPick, pushPickLib}
}

export const useManageSections = (response?: string[], step2 = true): [s: string, Setter: (s: string) => void] => {
    const [side, sSide] = useState('');
    const [sysSide, setSysSide] = useRecoilState(SettingsSegmentContext);

    useEffect(() => {
        if (response?.length) {
            const temp = side === '' ? response[0] : side;
            if (sysSide.step2 && step2) {
                const check = response.some(e => e === sysSide.step2);
                check ? sSide(sysSide.step2) : sSide(temp);

            } else if (sysSide.step1 && !step2) {
                const check = response.some(e => e === sysSide.step1);
                check ? sSide(sysSide.step1) : sSide(temp);

            } else sSide(temp);
        }
    }, [response, sysSide, side, step2]);

    const setSide = useCallback((side: string) => {
        sSide(side);
        setSysSide({step1: null, step2: null});
    }, [sSide, setSysSide]);

    return [side, setSide]
}

export const useManageUserInfo = () => {
    const base = useBase();
    const [playback, setPlaybackSettings] = useRecoilState(UserPlaybackSettingsContext);

    const deleteWatchEntry = useCallback(async (id: number, setResponse: Dispatch<SetStateAction<WatchHistory[]>>) => {
        await base.makeRequest<boolean>(`/api/modify/deleteWatchEntry?id=${id}`, null);
        setResponse(prev => prev.filter(e => e.watchedId !== id));
    }, [base]);

    const deleteFromMyList = useCallback(async (id: number, setResponse: Dispatch<SetStateAction<MyList[]>>) => {
        await base.makeRequest<boolean>(`/api/media/addToList?mediaId=${id}`, null);
        setResponse(prev => prev.filter(e => e.id !== id));
    }, [base]);

    const getUserDetails = useCallback(async () => {
        const details = await base.makeRequest<PlaybackSettings>(`/api/modify/getUserSettings`, null);
        if (details)
            setPlaybackSettings(details);
    }, [base, setPlaybackSettings]);

    const goIncognito = useCallback(async (b: boolean) => {
        const data = {...playback, inform: !b};
        await base.makeRequest(`/api/modify/modifyPlaybackInfo`, data);
        await getUserDetails();
    }, [playback]);

    const setAutoPlay = useCallback(async (b: boolean) => {
        const data = {...playback, autoPlay: b};
        await base.makeRequest(`/api/modify/modifyPlaybackInfo`, data);
        await getUserDetails();
    }, [playback]);

    return {deleteWatchEntry, deleteFromMyList, setAutoPlay, goIncognito, getUserDetails, settings: playback}
}

export default function useModify() {
    const base = useBase();
    const [media, setMedia] = useRecoilState(EditFrontMediaAtom);
    const found = useRecoilValue(DeleteAndLocationAtom);
    const setUnsaved = useSetRecoilState(UnsavedFrontMediaAtom);
    const dispatch = useConfirmDispatch();
    const setMediaData = useSetRecoilState(InfoContext);

    const getMedia = useCallback(async (mediaId: number) => {
        const med = await base.makeRequest<MedForMod>('/api/modify/getMedia', {mediaId}, 'POST');
        if (med) {
            const location = med.file ? med.file.location as string : '';
            setMedia({...med, location});
        }
    }, [base, setMedia]);

    const getImages = useCallback(async (tmdbId: number, type: MediaType, name: string, year: number) => {
        return await base.makeRequest<FrontImages>('/api/modify/getImages', {tmdbId, name, type, year}, 'POST');
    }, [base]);

    const modifyMedia = useCallback(async (cb: () => void) => {
        if (isNaN(media.tmdbId) || media.poster === '' || media.backdrop === '' || media.name === '') {
            dispatch({
                type: 'error',
                heading: 'Missing information',
                message: 'Please fill out all the fields before submitting.',
            });
            return;

        } else {
            const check = await base.makeRequest<boolean>('/api/modify/modifyMedia', {
                mediaId: media.mediaId,
                media
            }, 'POST');
            if (check) {
                dispatch({
                    type: 'success',
                    heading: `Media ${media.stateType === 'MODIFY' ? 'modified' : 'added'} successfully`,
                    message: `The media, ${media.name} has been ${media.stateType === 'MODIFY' ? 'modified' : 'added'} successfully`,
                });

                setUnsaved(unsaved => unsaved.filter(m => m.file?.location !== media.location));
            } else {
                dispatch({
                    type: 'error',
                    heading: 'Error modifying media',
                    message: `There was an error modifying ${media.name}`,
                });
            }
        }

        cb();
        const moddedMedia = await base.makeRequest<SpringMedia>('/api/modify/getModdedMedia', {mediaId: media.mediaId}, 'POST');
        setMediaData(moddedMedia);
    }, [base, media, setMediaData, dispatch]);

    const modifyEpisode = useCallback(async (episode: EpisodeModSettings) => {
        const check = await base.makeRequest<boolean>('/api/modify/modifyEpisode', {episodeId: episode.episodeId, episode}, 'POST');
        if (check) {
            dispatch({
                type: 'success',
                heading: 'Episode modified successfully',
                message: `The episode, with season ${episode.seasonId} and ${episode.episode} has been modified successfully`,
            });
        } else {
            dispatch({
                type: 'error',
                heading: 'Error modifying episode',
                message: `There was an error modifying the episode with season ${episode.seasonId} and episode ${episode.episode}`,
            });
        }
    }, [base, dispatch]);

    const getMediaInfo = useCallback(async (tmdbId: number, type: MediaType) => {
        const check = await base.makeRequest<{ name: string, location: string } | null>('/api/modify/checkMedia', {
            tmdbId,
            type
        }, 'POST');
        const media = await base.makeRequest<tmdbMedia>('/api/modify/getMediaInfo', {tmdbId, type}, 'POST');
        if (media && check) {
            dispatch({
                type: 'error',
                heading: 'Media already exists',
                message: `${media.name} already exists in the database with the name ${check.name}`,
            })
        }

        return {media, check};
    }, [base, dispatch]);

    const deleteMedia = useCallback(async (cb: () => void) => {
        if (found.del && found.location) {
            const {location, name} = found;
            const check = await base.makeRequest<{ name: string }>('/api/modify/deleteMedia', {location}, 'POST');
            if (check) {
                dispatch({
                    type: 'success',
                    heading: `Media deleted successful`,
                    message: `The media, ${name} with file ${check.name} has been deleted successfully`,
                });

                setUnsaved(unsaved => unsaved.filter(m => m.file?.location !== location));
            } else {
                dispatch({
                    type: 'error',
                    heading: 'Error deleting media',
                    message: `There was an error deleting ${name}`,
                });
            }

            cb();
        }
    }, [base, dispatch, found, setUnsaved]);

    const scanSubs = useCallback(async () => {
        const check = await base.makeRequest<boolean>('/api/modify/scanSubs', {mediaId: media.mediaId}, 'POST');
        if (check) {
            dispatch({
                type: 'success',
                heading: `Subtitles scanned successfully`,
                message: `The subtitles for ${media.name} have been scanned successfully`,
            });
        } else {
            dispatch({
                type: 'error',
                heading: 'Error scanning subtitles',
                message: `There was an error scanning the subtitles for ${media.name}`,
            });
        }
    }, [base, media, dispatch]);

    const scanMedia = useCallback(async (bool: boolean) => {
        dispatch({
            type: 'success',
            heading: `Scanning all media`,
            message: `Scanning all media`,
        });
        base.makeRequest<boolean>('/api/modify/scanEpisodes', {
            mediaId: media.mediaId,
            thorough: bool
        }, 'POST').then(() => {
            dispatch({
                type: 'success',
                heading: `All media scanned successfully`,
                message: `All media has been scanned successfully`,
            });
        }).finally(async () => {
            const moddedMedia = await base.makeRequest<SpringMedia>('/api/modify/getModdedMedia', {mediaId: media.mediaId}, 'POST');
            setMediaData(moddedMedia);
        });
    }, [base, media, setMediaData, dispatch]);

    const scanAllMedia = useCallback(() => {
        dispatch({
            type: 'success',
            heading: `Scanning all media`,
            message: `Scanning all media`,
        });
        base.makeRequest<boolean>('/api/modify/scanAllMedia', {}, 'POST').then(() => {
            dispatch({
                type: 'success',
                heading: `All media scanned successfully`,
                message: `All media has been scanned successfully`,
            });
        });
    }, [base, dispatch]);

    const scanAllSubs = useCallback(() => {
        dispatch({
            type: 'success',
            heading: `Scanning all media`,
            message: `Scanning all media`,
        });
        base.makeRequest<boolean>('/api/modify/scanAllSubs', {}, 'POST').then(() => {
            dispatch({
                type: 'success',
                heading: `All media scanned successfully`,
                message: `All media has been scanned successfully`,
            });
        });
    }, [base, dispatch]);

    const scanAllEpisodes = useCallback(() => {
        dispatch({
            type: 'success',
            heading: `Scanning all episodes`,
            message: `Scanning all episodes for all media`,
        });
        base.makeRequest<boolean>('/api/modify/scanAllEpisodes', {}, 'POST').then(async () => {
            dispatch({
                type: 'success',
                heading: `Episodes scanned successfully`,
                message: `All episodes for all media has been scanned successfully`,
            });
        });
    }, [base, dispatch]);

    return {
        scanMedia, getMedia, deleteMedia, getImages,
        modifyMedia, modifyEpisode, scanAllEpisodes,
        getMediaInfo, scanAllMedia, scanSubs, scanAllSubs,
    };
}