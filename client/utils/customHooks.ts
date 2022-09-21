import useSWR, {SWRConfiguration} from "swr";
import {MouseEvent, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {atomFamily, useRecoilState} from "recoil";
import {useConfirmDispatch} from "./notifications";
import {useRouter} from "next/router";
import {ParsedUrlQuery} from "querystring";
import useBase from "./provider";

declare global {
    interface Document {
        pictureInPictureElement?: HTMLElement;
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

export interface default_t<T = any> {
    [key: string]: T;
}

interface YTPlayer {
    stopVideo: () => void;
    destroy: () => void;
    setVolume: (arg0: number) => void;
    playVideo: () => void;
}

export const useClipboard = () => {
    const dispatch = useConfirmDispatch();

    const copy = useCallback(async (value: string, success: string) => {
        navigator.clipboard.writeText(value)
            .then(() => {
                dispatch({
                    type: "success",
                    heading: 'Copy Successful',
                    message: success
                })
            })
            .catch((error) => {
                dispatch({
                    type: "error",
                    heading: 'Something went wrong',
                    message: error as string
                })
            })
    }, [dispatch]);

    const paste = useCallback(async (success: string) => {
        navigator.clipboard.readText()
            .then(() => {
                dispatch({
                    type: "success",
                    heading: 'Paste Successful',
                    message: success
                })
            })
            .catch((error) => {
                dispatch({
                    type: "error",
                    heading: 'Something went wrong',
                    message: error as string
                })
            })
    }, [dispatch]);

    return {
        copy, paste
    }
}

export const useDetectPageChange = (checkShallow = false, callback?: (ev: { url: string, loading: boolean, shallow: boolean }) => void) => {
    const router = useRouter();
    const {isMounted} = useBasics();
    const savedHandler = useRef<(ev: { url: string, loading: boolean, shallow: boolean }) => void>();
    const url = useMemo(() => router.pathname, [router.pathname]);
    const loading = useRef(false);

    useEffect(() => {
        savedHandler.current = callback;
    }, [callback]);

    const handleRouteChange = useCallback((url: string, shallow: boolean, isLoading: boolean) => {
        isMounted() && savedHandler.current && savedHandler.current({url, loading: isLoading, shallow});
        if (shallow && !checkShallow)
            return;
        loading.current = isLoading;
    }, [isMounted, checkShallow]);

    useEffect(() => {
        router.events.on('routeChangeStart', (url, {shallow}) => {
            handleRouteChange(url, shallow, true);
        });

        router.events.on('routeChangeComplete', (url, {shallow}) => {
            handleRouteChange(url, shallow, false);
        });

        return () => {
            router.events.off('routeChangeStart', (url, {shallow}) => {
                handleRouteChange(url, shallow, true);
            });

            router.events.off('routeChangeComplete', (url, {shallow}) => {
                handleRouteChange(url, shallow, false);
            });
        }
    }, [router])

    return {url, loading: loading.current, router};
}

export const fetcher = <S>(url: string, cancel?: AbortSignal, method: 'GET' | 'POST' = 'GET', body?: any) => {
    return new Promise<S>((resolve, reject) => {
        fetch(url, {
            method: method,
            signal: cancel,
            body: body ? JSON.stringify(body) : undefined,
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        }).then(res => {
            if (res.ok)
                return res.json();

            throw new Error(res.statusText);
        }).then(resolve)
            .catch(error => {
                if (error.name === "AbortError") {
                    return;
                }
                reject(error);
            });
    })
}

export function useFetcher<S>(key: string, config?: SWRConfiguration & { method?: 'GET' | 'POST', postBody?: any }) {
    const source = new AbortController();
    const cancel = source.abort.bind(source);
    const {
        data,
        error
    } = useSWR<S>(key, (url) => fetcher<S>(url, source.signal, config?.method, config?.postBody), config);
    return {response: data, error, loading: !error && !data, abort: {cancel}};
}

export function useEventListener<T extends Element>(eventName: string, handler: (ev: any) => void, element?: T | null) {
    const savedHandler = useRef<(ev: any) => void>(handler);

    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

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

export function useWindowListener<T extends Element>(eventName: string, handler: (ev: any) => void, win?: Window | null) {
    const savedHandler = useRef<(ev: any) => void>(handler);

    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        const eventListener = (event: any) => {
            return savedHandler.current(event);
        }
        (win || window).addEventListener(eventName, eventListener);
        return () => {
            window.removeEventListener(eventName, eventListener);
        };
    }, []);
}

export const useInterval = (callback: () => void, seconds: number, tick = true) => {
    const savedCallback = useRef(callback);
    const id = useRef<NodeJS.Timeout>()

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        if (seconds === 0)
            return;

        tick && savedCallback.current();
        id.current = setInterval(() => savedCallback.current(), seconds * 1000);
        return () => id.current && clearInterval(id.current);
    }, [seconds]);

    const clear = useCallback(() => {
        id.current && clearInterval(id.current);
    }, [id]);

    const restart = useCallback(() => {
        clear();
        id.current = setInterval(() => savedCallback.current(), seconds * 1000);
    }, [clear, seconds]);

    return {clear, restart};
}

export const useLoop = (initialState: { start: number, end: number }) => {
    const [state, setState] = useState(initialState);

    const {clear, restart} = useInterval(() => setState(state => {
        return {...state, start: state.end - 1 < state.start + 1 ? 0 : state.start + 1}
    }), 20, false);

    const switchTo = useCallback((start: number, end: number) => {
        clear();
        setState({start, end});
        restart();
    }, [clear, restart])

    return {current: state.start, prev: state.start === 0 ? state.end : state.start - 1, clear, restart, switchTo};
}

export const useDraggable = (callback: (pos: number) => void) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragWidth, setDragWidth] = useState<string>();
    const savedCallback = useRef(callback);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    const handleMouseDown = useCallback((event: MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setIsDragging(true);
    }, [])

    const handleMouseMove = useCallback((event: MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        if (isDragging) {
            const rect = event.currentTarget!.getBoundingClientRect();
            const pos = ((event.clientX - rect.left) / (rect.right - rect.left));
            console.log(pos);
            setDragWidth(`${pos * 100}%`)
        }
    }, [isDragging])

    const handleMouseUp = useCallback((event: MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        if (isDragging) {
            const rect = event.currentTarget!.getBoundingClientRect();
            const pos = ((event.clientX - rect.left) / (rect.right - rect.left));
            savedCallback.current(pos);
            setDragWidth(undefined);
            setIsDragging(false);
        }
    }, [isDragging])

    return {isDragging, dragWidth, handleMouseDown, handleMouseMove, handleMouseUp};
}

export const hookChangeAtomFamily = atomFamily<any, string>({
    key: 'hookChangeAtomFamily',
    default: undefined
})

export const useEventEmitter = <S>(eventName: string) => {
    const {isMounted} = useBasics();
    const [hook, setHook] = useRecoilState<S | undefined>(hookChangeAtomFamily(eventName));
    const sb = useRef<(a: S) => void>();

    useEffect(() => {
        if (isMounted() && sb.current && hook !== undefined)
            sb.current(hook);
    }, [hook])

    const subscribe = useCallback((callback: (a: S) => void) => {
        sb.current = callback;
    }, [])

    return {
        state: hook,
        subscribe, emit: setHook
    }
}

export const usePreviousState = <S>(state: S) => {
    const ref = useRef<S>();

    useEffect(() => {
        ref.current = state;
    }, [state])

    return ref.current;
}

export const useBasics = () => {
    const isMountedRef = useRef(true);
    const isServer = typeof window === 'undefined';
    const [windowOpen, setMonitor] = useState(false);
    const [win, setWin] = useState<Window | null>(null);
    const isMounted = useCallback(() => isMountedRef.current, [isMountedRef.current]);
    const {clear, restart} = useInterval(() => {
        setMonitor(true);
        if (win) {
            if (win.closed) {
                setMonitor(false);
                setWin(null);
                clear();
            }
        } else {
            setMonitor(false);
            setWin(null);
            clear();
        }
    }, 1);

    const getBaseUrl = useCallback(() => {
        if (isServer)
            return '';
        else
            return window.location.protocol + '//' + window.location.host;
    }, [isServer]);

    const isMobile = useMemo(() => {
        if (isServer)
            return false;

        else {
            const toMatch = [
                /Android/i,
                /webOS/i,
                /iPhone/i,
                /iPad/i,
                /iPod/i,
                /Windows Phone/i
            ];

            return toMatch.some((toMatchItem) => {
                return navigator.userAgent.match(toMatchItem);
            });
        }
    }, [isServer]);

    const openPopup = useCallback((url: string, title: string, w: number, h: number) => {
        const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
        const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

        const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
        const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

        const systemZoom = width / window.screen.availWidth;
        const left = (width - w) / 2 / systemZoom + dualScreenLeft
        const top = (height - h) / 2 / systemZoom + dualScreenTop
        const newWindow = window.open(url, title,
            `
          scrollbars=yes,
          width=${w / systemZoom}, 
          height=${h / systemZoom}, 
          top=${top}, 
          left=${left}
          `
        )

        newWindow?.focus();
        setWin(newWindow);
        restart();
    }, [restart]);

    useEffect(() => {
        return () => void (isMountedRef.current = false);
    }, []);

    return {isServer, isMounted, getBaseUrl, isMobile, openPopup, windowOpen, window: win};
}

export const usePoster = <S>(url: string, body: any) => {
    const source = new AbortController();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | undefined>(undefined);
    const [response, setResponse] = useState<S | undefined>(undefined);
    const cancel = source.abort.bind(source);

    const runFunction = useCallback((url: string, body: any) => {
        fetch(url, {
            method: "POST",
            signal: source.signal,
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
            }
        }).then(res => res.json()).then(res => {
            setResponse(res);
            setLoading(false);

        }).catch(error => {
            setError(error);
            setLoading(false);

        }).finally(() => {
            setLoading(false);
        });
    }, [])

    subscribe(([url, body]) => {
        runFunction(url, body);
    }, [url, body]);

    return {response, error, loading, abort: {cancel}};
}

export const useFetch = <S>(url: string, body: default_t<string | number>) => {
    const source = new AbortController();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | undefined>(undefined);
    const [response, setResponse] = useState<S | undefined>(undefined);
    const cancel = source.abort.bind(source);

    const params = useMemo(() => {
        const params = new URLSearchParams();
        for (const key in body) {
            params.append(key, '' + body[key]);
        }
        return params.toString();
    }, [body]);

    subscribe(([params, url]) => runFunction(url, params), [params, url]);

    const runFunction = useCallback((url: string, params: string) => {
        fetch(`${url}?${params}`, {
            signal: source.signal,
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        }).then(res => res.json()).then(res => {
            setResponse(res);
            setLoading(false);

        }).catch(error => {
            setError(error);
            setLoading(false);

        }).finally(() => {
            setLoading(false);
        });
    }, [])

    return {response, error, loading, abort: {cancel}};
}

export function useYoutubePLayer() {
    const player = useRef<YTPlayer | null>(null);
    const [done, setDone] = useState(true);
    const [start, setStart] = useState(false);

    const loadTrailer = useCallback((trailerId: string, image: HTMLImageElement) => {
        if (!done)
            destroyTrailer();

        else {
            setStart(true);
            setDone(false);
            const string = `<div id="playerTwo" style="opacity: 0; width: 100%"></div>`;
            image.insertAdjacentHTML('afterend', string);
            if (player.current === null)
                // @ts-ignore
                player.current = new YT.Player('playerTwo', {
                    height: '390',
                    width: '640',
                    videoId: trailerId,
                    playerVars: {
                        controls: 0,
                        autoplay: 1,
                        enablejsapi: 1,
                        modestbranding: 1
                    },
                    events: {
                        onReady: playYoutubeVideo,
                        onStateChange: endVideo
                    }
                });
        }
    }, [done]);

    const endVideo = useCallback((event: { data: number; }) => {
        if (event.data === 0 && player.current) {
            document.getElementById('playerTwo')?.setAttribute('class', 'fade_input');
            setStart(false);
            setDone(true);

            player.current.destroy();
            setTimeout(() => {
                player.current = null;
                document.getElementById('playerTwo')?.remove();
            }, 400)
        }
    }, [player.current]);

    const playYoutubeVideo = useCallback(() => {
        if (player.current) {
            player.current.setVolume(50);
            player.current.playVideo();
            document.getElementById('playerTwo')?.setAttribute('class', 'glow_input');
        }
    }, [player.current]);

    const destroyTrailer = useCallback(() => {
        if (!done && player.current) {
            player.current.stopVideo();
            endVideo({data: 0});
        }
    }, [done, player.current, endVideo]);

    return {done, start, loadTrailer, destroyTrailer};
}

export function usePageQuery(handler: (query: ParsedUrlQuery) => void) {
    const savedCallback = useRef(handler);
    const {router, loading} = useDetectPageChange();
    const {isMounted} = useBasics();

    useEffect(() => {
        savedCallback.current = handler;
    }, [handler]);

    const query = useMemo(() => {
        if (isMounted())
            return router.query;

        return {};
    }, [router.query]);

    useEffect(() => {
        if (loading)
            return;
        savedCallback.current(query);
    }, [query, loading]);

    return null;
}

export function subscribe<S>(cb: (a: S, b?: S | undefined) => void, state: S) {
    const subscription = useRef<(a: S, b?: S | undefined) => void>(cb);
    const previousState = useRef<S>();

    useEffect(() => {
        subscription.current = cb;
    }, [cb]);

    useEffect(() => {
        if (JSON.stringify(state) !== JSON.stringify(previousState.current)) {
            subscription.current(state, previousState.current);
            previousState.current = state;
        }
    }, [state]);
}

export function useOnUnmount<S>(cb: (prev: S | undefined) => void, deps: S) {
    const subscription = useRef<(prev: S | undefined) => void>(cb);
    const previousDeps = useRef<S>();

    useEffect(() => {
        subscription.current = cb;
    }, [cb]);

    useEffect(() => {
        previousDeps.current = deps;
        return () => subscription.current(previousDeps.current);
    }, [deps]);
}

export function useInfiniteScroll<T>(address: string) {
    const [hasMore, setHasMore] = useState(true);
    const [data, setData] = useState<T[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const {abort} = useFetcher<{ pages: number, results: T[] }>(`${address}&page=${page}`, {
        revalidateOnFocus: false,
        onSuccess: (data: { pages: number, results: T[] }) => {
            setHasMore(data.pages !== page)
            setData(prev => prev.concat(data.results));
            setLoading(false);
        }, onError: () => {
            setLoading(false);
            setHasMore(false);
        }
    });

    useEffect(() => {
        if (address === '')
            abort.cancel();

        return () => {
            abort.cancel();
            setData([]);
            setPage(1);
            setHasMore(true);
            setLoading(true);
        }
    }, [address]);

    const loadMore = useCallback(() => {
        if (hasMore && !loading) {
            setLoading(true);
            setPage(prev => prev + 1);
        }
    }, [hasMore, loading]);

    const handleScroll = useCallback((event: any) => {
        const bottom = event.target.scrollHeight - event.target.scrollTop - 3000 <= event.target.clientHeight;
        if (bottom && hasMore && !loading)
            loadMore();
    }, [hasMore, loading, loadMore]);

    return {data, loading, hasMore, setData, handleScroll};
}

export const useTimer = () => {
    const timOut = useRef<NodeJS.Timeout>();

    const start = useCallback((callback: () => void, time: number) => {
        timOut.current = setTimeout(() => {
            callback();
        }, time);
    }, []);

    const stop = useCallback(() => {
        timOut.current && clearTimeout(timOut.current);
    }, []);

    return {start, stop};
}

export const useHomeSegments = () => {
    const base = useBase();
    const [basePick, setBasePick] = useState(1);
    const [editorPick, setEditorPick] = useState(2);
    const [recommendPick, setRecommendPick] = useState(2);
    const [segment, setSegment] = useState<string[]>(['myList', 'continue', 'rated', 'trending', 'popular', 'trendingCollection', 'suggestion', 'recommend1', 'editor1', 'basic1', 'seen', 'editor2', 'recommend2', 'added']);
    const [loading, setLoading] = useState(false);
    const callbackRef = useRef<() => void>(() => {});

    const addSegments = useCallback(() => {
        if (!loading) {
            setLoading(true);
            let [bas, edi, rec] = [basePick, editorPick, recommendPick];
            const string = [];

            for (let i = 0; i < 6; i++) {
                const temp = base.weightedRandom({
                    'recommend': 0.6,
                    'basicPick': 0.05,
                    'editorPick': 0.35
                })

                switch (temp) {
                    case 'recommend':
                        rec++;
                        string.push('recommend' + rec);
                        break;
                    case 'basicPick':
                        bas++;
                        string.push('basic' + bas);
                        break;
                    case 'editorPick':
                        edi++;
                        string.push('editor' + edi);
                        break;
                }
            }

            setBasePick(bas);
            setEditorPick(edi);
            setRecommendPick(rec);
            setSegment([...segment, ...string]);
            setLoading(false);
        }
    }, [base, editorPick, loading, recommendPick, segment]);

    const handleScroll = useCallback((event: any) => {
        callbackRef.current();

        const bottom = event.target.scrollHeight - event.target.scrollTop - 3000 <= event.target.clientHeight;
        if (bottom)
            addSegments();
    }, [addSegments]);

    const setCallback = useCallback((callback: () => void) => {
        callbackRef.current = callback;
    }, []);

    return {
        segment, handleScroll, setCallback
    }
}

export const useLocalStorage = <S>(key: string, initialValue: S) => {
    const [value, set] = useState<S>(() => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue as S;
    });

    const setValue = useCallback((newValue: S | ((arg: S) => S)) => {
        set(prev => {
            let value;
            if (newValue instanceof Function)
                value = newValue(prev);
            else
                value = newValue;
            localStorage.setItem(key, JSON.stringify(value));
            return value;
        })
    }, [key, set]);

    return [value, setValue] as const;
}
