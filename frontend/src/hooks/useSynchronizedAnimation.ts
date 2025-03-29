import { useRef, useLayoutEffect } from 'react';

const cache = new Map<string, CSSNumberish>();

export function useSynchronizedAnimation (animationName: string) {
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const stashedTime = cache.get(animationName);
        const animations = document
            .getAnimations()
            .filter((animation) => (animation as any).animationName === animationName);

        const myAnimation = animations.find(
            (animation) => (animation.effect as any).target === ref.current,
        );

        if (!myAnimation) {
            return;
        }

        if (myAnimation === animations[0] && stashedTime) {
            myAnimation.currentTime = stashedTime;
        }

        if (myAnimation !== animations[0]) {
            myAnimation.currentTime = animations[0].currentTime;
        }

        return () => {
            if (myAnimation === animations[0] && myAnimation.currentTime) {
                cache.set(animationName, myAnimation.currentTime);
            }
        };
    }, [animationName]);

    return ref;
}
