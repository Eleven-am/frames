import { Ref, useCallback, useEffect, useRef, useState } from 'react';

export function useResizeObserver <Element extends HTMLElement = HTMLElement> (): [Ref<Element>, DOMRect] {
    const [element, setElement] = useState<Element | null>(null);
    const observer = useRef<ResizeObserver | null>(null);
    const [bounds, set] = useState<DOMRect>({
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        toJSON: () => '',
        top: 0,
        width: 0,
        x: 0,
        y: 0,
    });

    useEffect(() => {
        observer.current = new ResizeObserver(([entry]) => set(entry.contentRect));

        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        if (element) {
            observer.current?.observe(element);

            return () => {
                observer.current?.unobserve(element);
            };
        }
    }, [element]);

    const ref = useCallback((node: Element | null) => {
        setElement(node);
    }, []);

    return [ref, bounds];
}

export function useMeasure<Element extends HTMLElement = HTMLElement> (): [Ref<Element>, DOMRect] {
    const [bounds, set] = useState<DOMRect>({
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        toJSON: () => '',
        top: 0,
        width: 0,
        x: 0,
        y: 0,
    });

    const ref = useCallback((node: Element | null) => {
        if (node !== null) {
            set(node.getBoundingClientRect());
        }
    }, []);

    return [ref, bounds];
}
