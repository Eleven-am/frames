import { useIsVisible } from '@eleven-am/xquery';
import { CSSProperties } from 'react';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    style?: CSSProperties;
    loading?: 'lazy' | 'eager';
}

export function LazyImage ({ src, alt, className, style, loading = 'lazy' }: LazyImageProps) {
    const [ref, inView] = useIsVisible({
        triggerOnce: true,
        options: {
            rootMargin: '100px',
        },
    });

    return (
        <img
            src={loading === 'eager' || inView ? src : undefined}
            className={className}
            ref={ref}
            loading={loading}
            style={style}
            alt={alt}
        />
    );
}

