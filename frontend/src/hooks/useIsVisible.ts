import { useRef, useCallback, useState, useEffect } from 'react';

interface UseIsVisibleOptions {
    action?: () => void;
    triggerOnce?: boolean;
    options?: IntersectionObserverInit;
}

type UseIsVisibleReturn = [(node: HTMLElement | null) => void, boolean];

export function useIsVisible ({ action, options, triggerOnce }: UseIsVisibleOptions = {
}): UseIsVisibleReturn {
    const intersectionRef = useRef<IntersectionObserver | null>(null);
    const callbackRef = useRef<(() => void) | undefined>(action);
    const [isVisible, setIsVisible] = useState(false);
    const triggerOnceRef = useRef(triggerOnce);

    useEffect(() => {
        callbackRef.current = action;
    }, [action]);

    const plugLastElement = useCallback((node: HTMLElement | null) => {
        if (intersectionRef.current) {
            intersectionRef.current.disconnect();
        }

        intersectionRef.current = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                callbackRef.current?.();
                setIsVisible(true);
                if (triggerOnceRef.current) {
                    intersectionRef.current?.disconnect();
                }
            } else {
                setIsVisible(false);
            }
        }, options);

        if (node) {
            intersectionRef.current.observe(node);
        }
    }, [options]);

    return [plugLastElement, isVisible];
}
