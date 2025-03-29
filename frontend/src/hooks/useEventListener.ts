import { useEffect, useRef } from 'react';

export function useEventListener<ElementType extends Element, EventName extends keyof GlobalEventHandlersEventMap> (eventName: EventName, handler: (ev: GlobalEventHandlersEventMap[EventName]) => void, element?: ElementType | null) {
    const savedHandler = useRef<(ev: GlobalEventHandlersEventMap[EventName]) => void>(handler);

    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        const myElement = element || document;
        const eventListener: EventListener = (event: Event) => savedHandler.current(event as GlobalEventHandlersEventMap[EventName]);

        myElement.addEventListener(eventName, eventListener);

        return () => {
            myElement.removeEventListener(eventName, eventListener);
        };
    }, [eventName, element]);
}

export function useWindowListener <EventName extends keyof WindowEventMap> (eventName: EventName, handler: (ev: WindowEventMap[EventName]) => void, win?: Window | null) {
    const savedHandler = useRef<(ev: WindowEventMap[EventName]) => void>(handler);

    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        const eventListener = (event: WindowEventMap[EventName]) => savedHandler.current(event);

        (win || window).addEventListener(eventName, eventListener);

        return () => {
            window.removeEventListener(eventName, eventListener);
        };
    }, [eventName, win]);
}
