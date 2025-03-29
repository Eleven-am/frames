import { HTMLProps, MouseEvent, useCallback } from 'react';

interface HoverElementProps<T extends keyof HTMLElementTagNameMap> extends HTMLProps<HTMLElementTagNameMap[T]> {
    element: T;
    onHover: (hover: boolean, event: MouseEvent<HTMLElementTagNameMap[T]>) => void;
}

export function HoverElement<T extends keyof HTMLElementTagNameMap> ({ element, onHover, onMouseEnter, onMouseLeave, ...props }: HoverElementProps<T>) {
    const Element = element as any;

    const handleMouseEnter = useCallback((event: MouseEvent<HTMLElementTagNameMap[T]>) => {
        onHover(true, event);
        if (onMouseEnter) {
            onMouseEnter(event);
        }
    }, [onHover, onMouseEnter]);

    const handleMouseLeave = useCallback((event: MouseEvent<HTMLElementTagNameMap[T]>) => {
        onHover(false, event);
        if (onMouseLeave) {
            onMouseLeave(event);
        }
    }, [onHover, onMouseLeave]);

    return (
        <Element
            {...props}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        />
    );
}

export function useOnHover <T extends HTMLElement> (callback: (hover: boolean, event: MouseEvent<T>) => void) {
    const onMouseEnter = useCallback((event: MouseEvent<T>) => callback(true, event), [callback]);
    const onMouseLeave = useCallback((event: MouseEvent<T>) => callback(false, event), [callback]);

    return {
        onMouseEnter,
        onMouseLeave,
    };
}
