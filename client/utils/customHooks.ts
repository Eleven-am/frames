import {AbortController} from "node-abort-controller";
import fetch from 'cross-fetch';
import useSWR, {SWRConfiguration} from "swr";
import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from "react";
import {atomFamily, useRecoilState, useSetRecoilState} from "recoil";
import NProgress from "nprogress";
import {navSection, NavSectionAndOpacity, SearchContextAtom} from "../next/components/navbar/navigation";
import {useRouter} from "next/router";
import {SearchPicker} from "../../server/classes/media";
import {useBase} from "./Providers";
import {useInfoDispatch} from "../next/components/misc/inform";
import {PrismaClient} from "@prisma/client";

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
        prisma: PrismaClient;
        WebKitPlaybackTargetAvailabilityEvent: any;
    }
}

export const fetcher = <S>(url: string, cancel?: AbortSignal) => {
    return new Promise<S>((resolve, reject) => {
        fetch(url, {
            method: "GET",
            signal: cancel,
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        }).then(res => res.json()).then(resolve)
            .catch(error => {
                if (error.name === "AbortError") {
                    return;
                }
                reject(error);
            });
    })
}

export function useFetcher<S>(key: string, config?: SWRConfiguration) {
    const source = new AbortController();
    const cancel = source.abort.bind(source);
    const {data, error} = useSWR<S>(key, (url) => fetcher<S>(url, source.signal), config);
    return {response: data, error, loading: !error && !data, abort: {cancel}};
}

export function useEventListener<T extends Element>(eventName: string, handler: (ev: any) => void, element?: T | null) {
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

export function useYoutubePLayer(image: React.RefObject<HTMLImageElement>, backdrop: React.RefObject<HTMLDivElement>, trailerId: string) {
    const player = useRef<YTPlayer | null>(null);
    const [done, setDone] = useState(true);
    const [start, setStart] = useState(false);

    function loadTrailer() {
        if (!done)
            destroyTrailer();

        else {
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

    return {done, start, loadTrailer, destroyTrailer};
}

export function useLoadEffect(effect: (() => void), deps: any[]) {
    const effectFunction = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
    effectFunction(effect, deps);
}

export function useNavBar(section: navSection, opacity: number) {
    const setNavBar = useSetRecoilState(NavSectionAndOpacity);
    useLoadEffect(() => {
        NProgress.done();
        setNavBar({opacity, section})
    }, [section, opacity]);
    return null;
}

export function useOnScreen<T extends Element>(watch = false, rootMargin = '900px'): [boolean, React.MutableRefObject<T | null>] {
    const {isMounted} = useBasics();
    const [visible, setVisible] = useState(false);

    const ref = useRef<T | null>(null);
    useEffect(() => {
        if (watch) {
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
        }, onError: (err) => {
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

    const handleScroll = (event: any) => {
        const bottom = event.target.scrollHeight - event.target.scrollTop - 3000 <= event.target.clientHeight;
        if (bottom && hasMore && !loading)
            loadMore();
    }

    return {data, loading, hasMore, setData, handleScroll};
}

export const useLoop = (initialState: { start: number, end: number }) => {
    const [state, setState] = useState(initialState);
    const [pause, setPause] = useState(false);
    const interval = useRef<NodeJS.Timeout>();

    useEffect(() => setState(initialState), []);

    useEffect(() => {
        interval.current && clearInterval(interval.current);
        interval.current = setInterval(
            () => setState(state => {
                return pause ? state : {...state, start: state.end - 1 < state.start + 1 ? 0 : state.start + 1}
            }), 20000);

        return () => interval?.current && clearInterval(interval.current);
    }, [pause, state]);

    return {
        setPause,
        current: state.start,
        prev: state.start === 0 ? state.end : state.start - 1,
        set: (start: number, end: number) => setState({start, end})
    };
}

export const useSearch = () => {
    const [errorState, setError] = useState('');
    const [search, setSearch] = useRecoilState(SearchContextAtom);
    const {
        response,
        abort,
        error,
        loading
    } = useFetcher<SearchPicker<'list'>>('/api/load/search?node=list&value=' + search);
    const {
        response: searchResponse,
        error: error2,
        loading: load,
        abort: abort2
    } = useFetcher<SearchPicker<'grid'>>('/api/load/search?node=grid&value=' + search);

    useEffect(() => {
        if (search === '') {
            abort.cancel();
            abort2.cancel();
            setError('');
        }

        return () => {
            abort.cancel();
            abort2.cancel();
        }
    }, [search])

    useEffect(() => {
        if (error || error2)
            setError(error?.message || error2?.message)
    }, [error, error])

    return {
        active: search !== '',
        loading: loading && load,
        grid: searchResponse || [],
        list: response || [],
        error: errorState,
        setSearch
    };
}

export const useDetectPageChange = (checkShallow = false, callback: (ev: { url: string, loading: boolean, shallow: boolean }) => void = () => {}) => {
    const router = useRouter();
    const savedHandler = useRef<(ev: { url: string, loading: boolean, shallow: boolean}) => void>(callback);
    const [url, setUrl] = useState(router.pathname);
    const [loading, setLoading] = useState(false);
    savedHandler.current = callback;

    const handleRouteChange = (url: string, {shallow}: { shallow: boolean }) => {
        if (shallow && !checkShallow)
            return;
        setUrl(url);
        setLoading(true);
        savedHandler.current({url, loading: true, shallow});
    }

    useEffect(() => {
        router.events.on('routeChangeStart', (url, {shallow}) => {
            savedHandler.current({url, loading: true, shallow});
            handleRouteChange(url, {shallow});
        });
        router.events.on('routeChangeComplete', (url: string) => {
            setUrl(url);
            setLoading(false);
            savedHandler.current({url, loading: false, shallow: false});
        });

        return () => {
            router.events.off('routeChangeStart', (url, {shallow}) => {
                savedHandler.current({url, loading: true, shallow});
                handleRouteChange(url, {shallow});
            });
            router.events.off('routeChangeComplete', (url: string) => {
                setUrl(url);
                setLoading(false);
                savedHandler.current({url, loading: false, shallow: false});
            });
        }
    }, [router])

    return {url, loading, router};
}

export const useHomeSegments = () => {
    const base = useBase();
    const [basePick, setBasePick] = useState(1);
    const [editorPick, setEditorPick] = useState(2);
    const [recommendPick, setRecommendPick] = useState(2);
    const [segment, setSegment] = useState<string[]>(['myList', 'continue', 'recommend1', 'rated', 'trending', 'suggestion', 'popular', 'editor1', 'basic1', 'seen', 'editor2', 'recommend2', 'added']);
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

const hookChangeAtomFamily = atomFamily<any, string>({
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
    const isMounted = useCallback(() => isMountedRef.current, [isMountedRef.current]);

    const getBaseUrl = () => {
        if (isServer)
            return '';
        else
            return window.location.protocol + '//' + window.location.host;
    }

    const isTabOrMobile = () => {
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
    }

    useEffect(() => {
        return () => void (isMountedRef.current = false);
    }, []);

    return {isServer, isMounted, getBaseUrl, isTabOrMobile};
}

export const useClipboard = () => {
    const dispatch = useInfoDispatch();

    const copy = async (value: string, success: string) => {
        navigator.clipboard.writeText(value)
            .then(() => {
                dispatch({
                    type: "alert",
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
    }

    const paste = async (success: string) => {
        navigator.clipboard.readText()
            .then((text) => {
                dispatch({
                    type: "alert",
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
    }

    return {
        copy, paste
    }
}

export const useInterval = (callback: () => void, seconds: number) => {
    const savedCallback = useRef(callback);

    useLoadEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        if (seconds === 0)
            return;

        const id = setInterval(() => savedCallback.current(), seconds * 1000);
        return () => clearInterval(id);
    }, [seconds]);
}

export function useLongPolling<S>(url: string, params: any, method: 'POST' | 'GET' = 'GET') {
    const base = useBase();
    const [state, setState] = useState<S>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handler = async () => {
        setLoading(true);
        const data = await base.makeRequest<S>(url, params, method);
        data && setState(data);
        data === null && setError('Something went wrong');
        setLoading(false);
    }

    useInterval(handler, 300);

    useEffect(() => {
        handler();
    }, [url, params, method]);

    return {
        state,
        loading,
        error
    }
}

export function useIsInView<T extends Element>(handler: () => void, option?: IntersectionObserverInit) {
    const element = useRef<T>();
    const handlerRef = useRef<(() => void)>(handler);

    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
        if (element.current) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting)
                        handlerRef.current();
                });
            }, option);
            observer.observe(element.current);
            return () => observer.disconnect();
        }
    }, [element.current]);

    return element;
}