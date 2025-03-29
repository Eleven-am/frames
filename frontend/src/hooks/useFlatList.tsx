import { useRef, useCallback, useState, useEffect, useMemo } from 'react';

import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

import { BaseButton, BaseButtonProps } from '@/components/button';
import { useEventListener } from '@/hooks/useEventListener';
import { Direction, useTimer } from '@/hooks/useIntervals';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import { findLastIndex, findIndexAndTransform } from '@/utils/arrayFunctions';
import { clamp } from '@/utils/helpers';
import { tw } from '@/utils/style';


export interface UseFlatListOptions {
    skip?: number;
    handleCurrentIndex?: (index: number) => void;
    noReset?: boolean;
    currentIndex?: number;
}

interface InnerChevronButtonProps extends Omit<BaseButtonProps, 'children' | 'title'> {
    direction: Direction;
    isHidden: boolean;
    svgClassName?: string;
}

interface ScrollDetails {
    hideLeftChevron: boolean;
    hideRightChevron: boolean;
}

type ChevronButtonProps = Omit<InnerChevronButtonProps, 'direction' | 'isHidden'>;

function isElementVisibleInParent (element: Element, parent: Element) {
    const elementRect = element.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    return elementRect.left >= parentRect.left &&
        elementRect.right <= parentRect.right;
}

function isElementPartiallyVisibleInParent (element: Element, parent: Element) {
    const elementRect = element.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    return elementRect.right > parentRect.left &&
        elementRect.left < parentRect.right;
}

function ChevronButton (props: InnerChevronButtonProps) {
    const { direction, svgClassName, isHidden, ...rest } = props;

    if (isHidden) {
        return null;
    }

    return (
        <BaseButton
            {...rest}
            title={direction === Direction.backward ? 'Move left' : 'Move right'}
        >
            {
                direction === Direction.backward
                    ? (
                        <FiChevronLeft
                            className={svgClassName}
                            strokeWidth={2}
                        />
                    )
                    : (
                        <FiChevronRight
                            className={svgClassName}
                            strokeWidth={2}
                        />
                    )
            }
        </BaseButton>
    );
}

function isTouchEnabledDevice () {
    return typeof window === 'undefined'
        ? false
        : 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function useFlatList (options?: UseFlatListOptions) {
    const isTouchDevice = useMemo(() => isTouchEnabledDevice(), []);
    const {
        skip = 0,
        noReset = false,
        handleCurrentIndex,
        currentIndex = -1,
    } = options ?? {
    };

    const { start, stop } = useTimer();
    const ulList = useRef<HTMLUListElement | null>(null);
    const parent = useRef<HTMLDivElement | null>(null);
    const [parentRef, { width }] = useResizeObserver();
    const [scrollDetails, setScrollDetails] = useState<ScrollDetails>({
        hideLeftChevron: true,
        hideRightChevron: true,
    });

    const getElements = useCallback(() => {
        if (!parent.current || !ulList.current) {
            return {
                children: [],
                parent: null,
            };
        }

        const children = Array.from(ulList.current.children);

        return {
            children,
            parent: parent.current,
        };
    }, []);

    const generateScrollDetails = useCallback(() => {
        const { children, parent } = getElements();
        const firstChild = children[0];
        const lastChild = children[children.length - 1];

        if (!firstChild || !lastChild || !parent || isTouchDevice) {
            return;
        }

        setScrollDetails({
            hideLeftChevron: isElementVisibleInParent(firstChild, parent),
            hideRightChevron: isElementVisibleInParent(lastChild, parent),
        });

        if (!isTouchDevice) {
            parent.style.overflowX = 'hidden';
        }
    }, [getElements, isTouchDevice]);

    const plugUlList = useCallback((node: HTMLUListElement | null) => {
        if (ulList.current && !node) {
            return;
        }

        ulList.current = node;
    }, []);

    const plugParent = useCallback((node: HTMLDivElement | null) => {
        if (parent.current && !node) {
            return;
        }

        parent.current = node;
        if (typeof parentRef === 'function') {
            parentRef(node);
        }

        if (!isTouchDevice && node) {
            node.scrollLeft = 0;
            node.style.overflowX = 'hidden';
        }

        generateScrollDetails();
        if (node) {
            const ul = node.querySelector<HTMLUListElement>('ul');

            if (ul) {
                plugUlList(ul);
            }
        }
    }, [generateScrollDetails, parentRef, plugUlList, isTouchDevice]);

    const scrollToPosition = useCallback((scrollTarget: number, parent: HTMLElement) => {
        const division = scrollTarget / 15;
        let currentlyScrolled = 0;

        return new Promise<void>((resolve) => {
            const intervalId = setInterval(() => {
                if (parent) {
                    parent.scrollLeft += division;
                    currentlyScrolled += division;
                    if (Math.abs(currentlyScrolled) >= Math.abs(scrollTarget)) {
                        clearInterval(intervalId);
                        resolve();
                    }
                } else {
                    clearInterval(intervalId);
                    resolve();
                }
            }, 10);
        });
    }, []);

    const scrollToElement = useCallback((index: number, parent: HTMLElement, children: Element[]) => {
        const element = children[index];

        const lastVisibleItemRect = element.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        const scrollTarget = lastVisibleItemRect.left - parentRect.left;

        return scrollToPosition(scrollTarget, parent);
    }, [scrollToPosition]);

    const moveLeft = useCallback(() => {
        const { children, parent } = getElements();

        if (!parent || !children.length) {
            return;
        }

        const firstVisibleIndex = children.findIndex((child) => isElementVisibleInParent(child, parent));
        const firstElement = children[firstVisibleIndex];

        if (!firstElement) {
            return;
        }

        if (currentIndex !== -1 && handleCurrentIndex) {
            const newCurrentIndex = clamp(currentIndex - skip, 0, children.length - 1);

            if (isElementVisibleInParent(children[newCurrentIndex], parent)) {
                handleCurrentIndex(newCurrentIndex);

                return;
            }

            const nextVisibleItem = clamp(firstVisibleIndex - skip, 0, children.length - 1);

            scrollToElement(nextVisibleItem, parent, children)
                .then(() => handleCurrentIndex(newCurrentIndex));

            return;
        }

        const { clientWidth } = parent;

        let nextIndex: number;

        if (skip === 0) {
            const scrollTarget = firstElement.getBoundingClientRect().left - clientWidth;

            nextIndex = findLastIndex(children, (child) => child.getBoundingClientRect().left < scrollTarget);
        } else {
            nextIndex = firstVisibleIndex - skip;
        }

        const nextVisibleItem = clamp(nextIndex, 0, children.length - 1);

        void scrollToElement(nextVisibleItem, parent, children);
    }, [currentIndex, getElements, handleCurrentIndex, scrollToElement, skip]);

    const moveRight = useCallback(() => {
        const { children, parent } = getElements();

        if (!parent || !children.length) {
            return;
        }

        if (currentIndex !== -1 && handleCurrentIndex) {
            const newCurrentIndex = clamp(currentIndex + skip, 0, children.length - 1);

            if (isElementVisibleInParent(children[newCurrentIndex], parent)) {
                handleCurrentIndex(newCurrentIndex);

                return;
            }

            const firstVisibleIndex = children.findIndex((child) => isElementVisibleInParent(child, parent));
            const nextVisibleItem = clamp(firstVisibleIndex + skip, 0, children.length - 1);

            scrollToElement(nextVisibleItem, parent, children)
                .then(() => handleCurrentIndex(newCurrentIndex));

            return;
        }

        const lastVisibleItem = skip !== 0
            ? findIndexAndTransform(
                children,
                (child) => isElementPartiallyVisibleInParent(child, parent),
                (index) => clamp(index + skip, 0, children.length - 1),
            )
            : findLastIndex(children, (child) => isElementVisibleInParent(child, parent));

        if (!lastVisibleItem || lastVisibleItem === -1) {
            return;
        }

        void scrollToElement(lastVisibleItem, parent, children);
    }, [currentIndex, getElements, handleCurrentIndex, scrollToElement, skip]);

    const resetScroll = useCallback(() => {
        const { parent, children } = getElements();

        if (!parent || !children.length || noReset || parent.scrollLeft === 0) {
            return;
        }

        void scrollToElement(0, parent, children);
    }, [getElements, noReset, scrollToElement]);

    const handleScrollEvent = useCallback(() => {
        stop();
        start(() => {
            generateScrollDetails();
        }, 150);
    }, [generateScrollDetails, start, stop]);

    const LeftChevronButton = useCallback((props: ChevronButtonProps) => {
        const { className, ...rest } = props;

        return (
            <ChevronButton
                {...rest}
                onClick={moveLeft}
                className={tw(className, 'left-0')}
                direction={Direction.backward}
                isHidden={scrollDetails.hideLeftChevron}
            />
        );
    }, [moveLeft, scrollDetails.hideLeftChevron]);

    const RightChevronButton = useCallback((props: ChevronButtonProps) => {
        const { className, ...rest } = props;

        return (
            <ChevronButton
                {...rest}
                onClick={moveRight}
                className={tw(className, 'right-0')}
                direction={Direction.forward}
                isHidden={scrollDetails.hideRightChevron}
            />
        );
    }, [moveRight, scrollDetails.hideRightChevron]);

    useEffect(() => {
        if (width) {
            generateScrollDetails();
        }
    }, [generateScrollDetails, width]);

    useEventListener('scroll', handleScrollEvent, parent.current);

    return {
        resetVisibility: generateScrollDetails,
        moveLeft,
        moveRight,
        LeftChevronButton,
        RightChevronButton,
        resetScroll,
        plugUlList,
        plugParent,
    };
}
