import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState
} from 'react';

const EventContext = createContext([
    (_event: any, _cb: ((...a: any[]) => void)) => {},
    (_event: any, _cb: ((...a: any[]) => void)) => {},
    (_event: any, _payload: any) => {},
]);

export const useEventDispatch = () => {
    const [_subscribe, _unsubscribe, dispatch] = useContext(EventContext);
    return dispatch as (_event: any, _payload: any) => {};
};

export const useEvent = (event: string, callback: ((...a: any[]) => void)) => {
    const [subscribe, unsubscribe, _dispatch] = useContext(EventContext);

    useEffect(() => {
        subscribe(event, callback);
        return () => unsubscribe(event, callback);
    }, [subscribe, unsubscribe, event, callback]);
};

export const useSubscriber = () =>  {
    const [s, us, _dispatch] = useContext(EventContext);
    const [e, setE] = useState<string>();
    const sb = useRef<((...a: any[]) => void)>(() => {});

    useEffect(() => {
        s(e, sb.current);
        return () => us(e, sb.current);
    }, [s, us, e, sb.current]);

    return useCallback((event: string, cb: (...a: any[]) => void) => {
        setE(event);
        sb.current = cb;
    }, []);
}

interface EventState {
    [key: string]: ((...a: any[]) => void)[];
}

interface EventReducerAction {
    type: 'subscribe' | 'unsubscribe';
    event: string;
    callback: ((...a: any[]) => void);
}

export const EventEmitter = ({children}: { children: ReactNode }) => {
    const [subscribers, dispatch] = useReducer((state: EventState, action: EventReducerAction) => {
        const {type, event} = action;
        switch (type) {
            case 'subscribe': {
                const {callback} = action;
                if (event in state) {
                    if (state[event].includes(callback)) {
                        return state;
                    }
                    return {...state, [event]: [...state[event], callback]};
                }
                return {...state, [event]: [callback]};
            }

            case 'unsubscribe': {
                const {callback} = action;
                if (event in state && state[event].includes(callback)) {
                    return {...state, [event]: [...state[event].filter(cb => cb !== callback)]};
                }
                return state;
            }

            default:
                throw new Error();
        }
    }, {}, () => ({}));

    const subscribersRef = useRef<EventState>({});

    subscribersRef.current = useMemo(() => subscribers, [subscribers]);

    const subscribe = useCallback((event, callback) => {
        dispatch({type: 'subscribe', event, callback});
    }, [dispatch]);

    const unsubscribe = useCallback((event, callback) => {
        dispatch({type: 'unsubscribe', event, callback});
    }, [dispatch]);

    const dispatchEvent = useCallback((event: string, payload) => {
        if (event in subscribersRef?.current) {
            subscribersRef?.current[event].forEach(cb => cb(payload));
        }
    }, [subscribersRef]);

    const eventPack = useMemo(() => ([subscribe, unsubscribe, dispatchEvent]), [subscribe, unsubscribe, dispatchEvent],);

    return (
        <EventContext.Provider value={eventPack}>
            {children}
        </EventContext.Provider>
    );
};