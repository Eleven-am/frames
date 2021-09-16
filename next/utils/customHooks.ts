import axios, {CancelTokenSource} from "axios";
import useSWR, {useSWRInfinite, SWRConfiguration} from "swr";
import React, {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {RecoilState, useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {NavSectionAndOpacity} from "../states/navigation";
import NProgress from "nprogress";
import {GridOnScreenAtom} from "../states/gridLibraryContext";
import {SystemMaximised, SystemMPip} from "../states/miscStates";
import useUser from "./userTools";
import {AuthContextErrorAtom, AuthContextHandler, AuthErrors, AuthKeyAtom} from "../states/authContext";
import {Role} from "@prisma/client";

declare global {
    interface Document {
        pictureInPictureElement?: HTMLElement;
        pictureInPictureEnabled?: boolean;
        exitPictureInPicture: () => void;
        mozCancelFullScreen?: () => Promise<void>;
        msExitFullscreen?: () => Promise<void>;
        webkitExitFullscreen?: () => Promise<void>;
        mozFullScreenElement?: Element;
        msFullscreenElement?: Element;
        webkitFullscreenElement?: Element;
    }

    interface HTMLElement {
        msRequestFullscreen?: () => Promise<void>;
        mozRequestFullscreen?: () => Promise<void>;
        webkitRequestFullscreen?: () => Promise<void>;
        webkitShowPlaybackTargetPicker?: () => Promise<void>;
        requestPictureInPicture: () => void;
    }

    interface Window {
        WebKitPlaybackTargetAvailabilityEvent: any;
    }
}

const fetcher = <S>(url: string, cancel?: CancelTokenSource) => {
    return new Promise<S>(resolve => {
        axios({
            method: 'GET',
            url,
            cancelToken: cancel?.token
        }).then(res => resolve(res.data))
            .catch(e => {
                if (axios.isCancel(e)) return
                console.log(e)
            })
    })
}

export function useFetcher<S>(key: string, config?: SWRConfiguration) {
    const source = axios.CancelToken.source();
    const {data, error} = useSWR<S>(key, (url) => fetcher<S>(url, source), config)
    return {response: data, error, loading: !error && !data, abort: source};
}

export function useFullscreen(string: string): [boolean, (arg0: boolean) => void] {
    const [maximised, setMaximised] = useRecoilState(SystemMaximised);

    useEventListener('fullscreenchange', () => {
        setMaximised(!!document.fullscreenElement || !!document.mozFullScreenElement || !!document.webkitFullscreenElement || !!document.msFullscreenElement);
    });
    useEventListener('msfullscreenchange', () => {
        setMaximised(!!document.fullscreenElement || !!document.mozFullScreenElement || !!document.webkitFullscreenElement || !!document.msFullscreenElement);
    });
    useEventListener('mozfullscreenchange', () => {
        setMaximised(!!document.fullscreenElement || !!document.mozFullScreenElement || !!document.webkitFullscreenElement || !!document.msFullscreenElement);
    });
    useEventListener('webkitfullscreenchange', () => {
        setMaximised(!!document.fullscreenElement || !!document.mozFullScreenElement || !!document.webkitFullscreenElement || !!document.msFullscreenElement);
    });

    const toggleFS = useCallback(async (maximised: boolean) => {
        const holder = document.getElementById(string) as HTMLDivElement | null;
        if (holder) {
            if (maximised && !document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
                if (holder.requestFullscreen)
                    await holder.requestFullscreen();

                else if (holder.webkitRequestFullscreen)
                    await holder.webkitRequestFullscreen();

                else if (holder.msRequestFullscreen)
                    await holder.msRequestFullscreen();

                else if (holder.mozRequestFullscreen)
                    await holder.mozRequestFullscreen();
            } else {
                if (document.exitFullscreen)
                    await document.exitFullscreen();

                else if (document.webkitExitFullscreen)
                    await document.webkitExitFullscreen();

                else if (document.msExitFullscreen)
                    await document.msExitFullscreen();

                else if (document.mozCancelFullScreen)
                    await document.mozCancelFullScreen();
            }
        }
    }, [string])

    return [maximised, toggleFS];
}

export function usePip(video: HTMLVideoElement | null): [boolean, (arg0: boolean) => void] {
    const [pip, setPip] = useRecoilState(SystemMPip);

    useEventListener('enterpictureinpicture', () => {
        setPip(true);
    }, video)

    useEventListener('leavepictureinpicture', () => {
        setPip(false);
    }, video)

    const togglePip = useCallback((bool: boolean) => {
        if (video){
            if (document.pictureInPictureElement && !bool) {
                document.exitPictureInPicture();
            } else {
                if (document.pictureInPictureEnabled && bool) {
                    video.requestPictureInPicture();
                }
            }
        }
    }, [video])

    return [pip, togglePip];
}

export function useEventListener<T extends Element>(eventName: string, handler: (ev: any) => void, element?: T|null) {
    const savedHandler = useRef<(ev: any) => void>(handler);

    savedHandler.current = handler;

    useEffect(() => {
        const myElement = element || document;
        const eventListener = (event: any) => {
            return savedHandler.current(event);
        }
        myElement.addEventListener(eventName, eventListener);
        return () => {
            myElement.removeEventListener(eventName, eventListener);
        };
    }, [eventName, element]);
}

export function useWindowListener<T extends Element>(eventName: string, handler: (ev: any) => void) {
    const savedHandler = useRef<(ev: any) => void>(handler);

    savedHandler.current = handler;

    useEffect(() => {
        const eventListener = (event: any) => {
            return savedHandler.current(event);
        }
        window.addEventListener(eventName, eventListener);
        return () => {
            window.removeEventListener(eventName, eventListener);
        };
    }, []);
}

export function useLocalStorage<S>(key: string, initialValue: S): [S, (arg0: S) => void] {
    const [storedValue, setStoredValue] = useState<S>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            return initialValue;
        }
    });

    const setValue = (value: S) => {
        try {
            setStoredValue(value);
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
        }
    };

    return [storedValue, setValue];
}

interface YTPlayer {
    stopVideo: () => void;
    destroy: () => void;
    setVolume: (arg0: number) => void;
    playVideo: () => void;
}

export function useYoutubePLayer(image: React.RefObject<HTMLImageElement>, backdrop: React.RefObject<HTMLDivElement>, trailerId: string, playerState: RecoilState<boolean>) {
    const player = useRef<YTPlayer | null>(null);
    const [done, setDone] = useState(true);
    const [start, setStart] = useState(false);
    const [trailer, setTrailer] = useRecoilState(playerState);

    function loadTrailer() {
        if (!done)
            destroyTrailer();

        else {
            setTrailer(true);
            setStart(true);
            setDone(false);
            const string = `<div id="playerTwo" style="opacity: 0; width: 100%"></div>`;
            image.current?.insertAdjacentHTML('afterend', string);
            if (player.current === null)
                // @ts-ignore
                player.current = new YT.Player('playerTwo', {
                    height: '390',
                    width: '640',
                    videoId: trailerId,
                    playerVars: {
                        controls: 0,
                        enablejsapi: 1,
                        modestbranding: 1
                    },
                    events: {
                        onReady: playYoutubeVideo,
                        onStateChange: endVideo
                    }
                });
        }
    }

    function endVideo(event: { data: number; }) {
        if (event.data === 0 && player.current) {
            document.getElementById('playerTwo')?.setAttribute('class', 'fade_input');
            setStart(false);
            setDone(true);
            setTrailer && setTrailer(false)

            player.current.destroy();
            setTimeout(() => {
                player.current = null;
                document.getElementById('playerTwo')?.remove();
            }, 400)
        }
    }

    function playYoutubeVideo() {
        if (player.current) {
            player.current.setVolume(50);
            player.current.playVideo();
            document.getElementById('playerTwo')?.setAttribute('class', 'glow_input');
        }
    }

    function destroyTrailer() {
        if (!done && player.current) {
            player.current.stopVideo();
            endVideo({data: 0});
        }
    }

    useEffect(() => {
        if (!trailer)
            destroyTrailer();
    }, [trailer])

    return {done, start, loadTrailer};
}

export function useWeSocket<S>(SOCKET: string) {
    const isMounted = useIsMounted();
    const [data, setData] = useState<S>();
    const socket = useRef<WebSocket | null>(null);
    const [connected, setConnected] = useState(false);

    const connect = useCallback(() => {
        if (typeof window !== 'undefined' && socket.current?.readyState !== WebSocket.OPEN) {
            socket.current = new WebSocket(SOCKET);
            if (socket.current !== null) {
                socket.current.onopen = () => {
                    setConnected(true);
                }

                socket.current.onmessage = ev => {
                    const data = JSON.parse(ev.data);
                    setConnected(true);
                    setData(data);
                }

                socket.current.onclose = () => {
                    isMounted() && setConnected(false);
                }
            }
        }
    }, []);

    const sendData = useCallback((value: S) => {
        if (socket.current?.readyState === WebSocket.OPEN)
            try {
                socket.current?.send(JSON.stringify(value));
            } catch (e) {}
    }, [])

    const disconnect = () => socket.current?.close();
    return {disconnect, connected, data, sendData, connect}
}

export function useIsMounted() {
    const isMountedRef = useRef(true);
    const isMounted = useCallback(() => isMountedRef.current, [isMountedRef.current]);

    useEffect(() => {
        return () => void (isMountedRef.current = false);
    }, []);

    return isMounted;
}

export function useLoadEffect(effect: (() => void), deps: any[]) {
    const effectFunction = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
    effectFunction(effect, deps);
}

export function useNavBar(section: string, opacity: number) {
    const setNavBar = useSetRecoilState(NavSectionAndOpacity);
    useLoadEffect(() => {
        NProgress.done();
        setNavBar({opacity, section})
    }, [section, opacity]);
    return null;
}

export function useOnScreen<T extends  Element>(watch = false, rootMargin = '900px'): [boolean, React.MutableRefObject<T|null>] {
    const isMounted = useIsMounted();
    const [visible, setVisible] = useState(false);

    const ref = useRef<T|null>(null);
    useEffect(() => {
        if (watch){
            const observer = new IntersectionObserver(([entry]) => {
                isMounted() && setVisible(entry.isIntersecting);
            }, {rootMargin});

            if (ref.current)
                observer.observe(ref.current);

            return () => {
                ref.current && observer.unobserve(ref.current);
            };
        }
    }, [ref.current, watch]);

    return [visible, ref];
}

export function useInfiniteScroll<S>(type: string, value: string) {
    const isFetching = useRef(false);
    const maxPages = useRef(1);
    const onScreen = useRecoilValue(GridOnScreenAtom);

    const {data, size, error, setSize, isValidating} = useSWRInfinite((page, previousPageData) => {
        if (maxPages.current < page + 1) return null;
        if (previousPageData?.length === 0) return null;
        if (isFetching.current && page) return null
        if (type === '' || value === '') return null;
        return `/api/load/${type}?${type}=${value}&page=${page + 1}`
    }, async (key: string) => {
        let val: S[] | null = null;
        try {
            isFetching.current = true
            const res = await fetcher<{ data: S[], pages: number }>(key);
            val = res.data;
            maxPages.current = res.pages;
            if (isFetching.current)
                isFetching.current = false
        } catch (e) {
            if (isFetching.current)
                isFetching.current = false
            throw e;
        }

        return val;
    }, {revalidateAll: false});

    const isLoadingInitialData = !data && !error
    const isLoadingMore =
        isLoadingInitialData ||
        (isValidating && size > 1 && data && typeof data[size - 1] === 'undefined');

    useEffect(() => {
        if (onScreen && !isLoadingMore && !isFetching.current)
            setSize(size1 => size1 + 1);
    }, [onScreen]);

    const flat = useMemo(() => {
        if (!isNaN(data as any))
            return [];
        return data?.map(page => page as S[])
            ?.flat(1)
    }, [data])

    return {data: flat, loading: !!isLoadingMore, error};
}

export function useAuth() {
    const {user, confirmAuthKey} = useUser();
    const [lAuth, setLAuth] = useState(false);
    const [valid, setValid] = useState(false);
    const [auth, setAuth] = useRecoilState(AuthKeyAtom);
    const {authError} = useRecoilValue(AuthErrors);
    const {error} = useRecoilValue(AuthContextHandler);
    const setError = useSetRecoilState(AuthContextErrorAtom);

    const confirmKey = async () => {
        const res = await confirmAuthKey(auth);
        if (res !== 0) {
            const error = res === -1 ? 'invalid auth key': 'this auth key has already been used';
            setError(error);
            setLAuth(true);
        } else
            setValid(true);
    }

    const manageAuth = async (auth: string) => {
        if (auth.length === 23)
            await confirmKey()

        else if (auth === 'homeBase') {
            if (user?.role === Role.ADMIN)
                setValid(true);

            else {
                setError('invalid auth key')
                setLAuth(true);
            }
        }

        else {
            setError(null);
            setLAuth(false);
        }
    }

    useEffect(() => {
        manageAuth(auth);
    }, [auth])

    return {authError: authError || lAuth, auth, setAuth, valid, error}
}
