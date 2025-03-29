import { CSSProperties, MouseEvent, ReactNode, useCallback, useMemo, useState } from 'react';

import { Link } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';

import { Direction } from '@/hooks/useIntervals';
import { useTabs, UseTabsOptions } from '@/hooks/useTabs';
import { tw } from '@/utils/style';


interface Route {
    name: string;
    path: string;
}

interface TabsProps {
    liClassName?: string;
    activeTabIndex: number;
    tabs: string[] | Route[];
    holderClassName?: string;
    ulClassName?: string;
    activeLiClassName?: string;
    underlineClassName?: string;
    vertical?: boolean;
    onTabClick?: (index: number) => void;
}

type TabsHolderUnion<Tab extends string> = UseTabsOptions<Tab> & Omit<TabsProps, 'activeTabIndex' | 'onTabClick' | 'tabs'>;

interface TabsHolderProps<Tab extends string> extends TabsHolderUnion<Tab> {
    wrapperClassName?: string;
    componentWrapperClassName?: string;
}

interface CustomVariant {
    direction: Direction;
    horizontal: boolean;
}

const variants = {
    enter: ({ direction, horizontal }: CustomVariant) => ({
        x: horizontal ? (direction === Direction.forward ? 1 : -1) * 100 : 0,
        y: horizontal ? 0 : (direction === Direction.forward ? 1 : -1) * 100,
        opacity: 0,
    }),
    center: {
        x: 0,
        y: 0,
        opacity: 1,
    },
    exit: ({ direction, horizontal }: CustomVariant) => ({
        x: horizontal ? (direction === Direction.forward ? -1 : 1) * 100 : 0,
        y: horizontal ? 0 : (direction === Direction.forward ? -1 : 1) * 100,
        opacity: 0,
    }),
};

interface ElementProps {
    index: number;
    children: ReactNode;
    liClassName?: string;
    activeTabIndex?: number;
    activeLiClassName: string;
    handleTabClick: (index: number) => (ev: MouseEvent<HTMLLIElement>) => void;
}

interface TabElementProps {
    tab: string | Route;
    index: number;
    liClassName?: string;
    activeTabIndex: number;
    activeLiClassName: string;
    handleTabClick: (index: number) => (ev: MouseEvent<HTMLLIElement>) => void;
}

function Element ({ index, children, liClassName, activeTabIndex, activeLiClassName, handleTabClick }: ElementProps) {
    return (
        <li
            onClick={handleTabClick(index)}
            data-active={index === activeTabIndex}
            className={
                tw('cursor-pointer transition-all duration-200 whitespace-nowrap', liClassName, {
                    [activeLiClassName]: index === activeTabIndex,
                })
            }
        >
            {children}
        </li>
    );
}

function TabElement ({ tab, index, liClassName, activeTabIndex, activeLiClassName, handleTabClick }: TabElementProps) {
    if (typeof tab === 'string') {
        return (
            <Element
                index={index}
                liClassName={liClassName}
                activeTabIndex={activeTabIndex}
                activeLiClassName={activeLiClassName}
                handleTabClick={handleTabClick}
            >
                {tab}
            </Element>
        );
    }

    return (
        <Link to={tab.path}>
            <Element
                index={index}
                liClassName={liClassName}
                activeTabIndex={activeTabIndex}
                activeLiClassName={activeLiClassName}
                handleTabClick={handleTabClick}
            >
                {tab.name}
            </Element>
        </Link>
    );
}

export function Tabs ({ tabs, activeTabIndex, onTabClick, holderClassName, underlineClassName, liClassName, ulClassName, activeLiClassName = '', vertical = false }: TabsProps) {
    const [{ width, left, height, top }, setUnderline] = useState({
        width: 0,
        left: 0,
        height: 0,
        top: 0,
    });

    const handleTabClick = useCallback((index: number) => (ev: MouseEvent<HTMLLIElement>) => {
        const tab = ev.currentTarget;
        const tabWidth = tab.offsetWidth;
        const tabLeft = tab.offsetLeft;
        const tabHeight = tab.offsetHeight;
        const tabTop = tab.offsetTop;

        setUnderline({
            width: tabWidth,
            left: tabLeft,
            height: tabHeight,
            top: tabTop,
        });

        if (onTabClick) {
            onTabClick(index);
        }
    }, [onTabClick]);

    const setUnderlineOnMount = useCallback((ref: HTMLUListElement | null) => {
        if (ref) {
            const tab = ref.children[activeTabIndex] as HTMLLIElement | undefined;

            if (tab) {
                const tabWidth = tab.offsetWidth;
                const tabLeft = tab.offsetLeft;
                const tabHeight = tab.offsetHeight;
                const tabTop = tab.offsetTop;

                setUnderline({
                    width: tabWidth,
                    left: tabLeft,
                    height: tabHeight,
                    top: tabTop,
                });
            } else {
                setUnderline({
                    width: 0,
                    left: 0,
                    height: 0,
                    top: 0,
                });
            }
        }
    }, [activeTabIndex]);

    const styles = useMemo((): CSSProperties => {
        if (!vertical) {
            return {
                width,
                left,
            };
        }

        return {
            height,
            top,
        };
    }, [height, vertical, left, top, width]);

    const Element = typeof tabs[0] === 'string' ? 'div' : 'nav';

    return (
        <Element className={tw('relative', holderClassName)}>
            <ul
                ref={setUnderlineOnMount}
                className={
                    tw(
                        'flex items-center',
                        {
                            'flex-col': vertical,
                            'flex-row': !vertical,
                        },
                        ulClassName,
                    )
                }
            >
                {
                    tabs.map((tab, index) => (
                        <TabElement
                            tab={tab}
                            index={index}
                            liClassName={liClassName}
                            handleTabClick={handleTabClick}
                            activeTabIndex={activeTabIndex}
                            activeLiClassName={activeLiClassName}
                            key={typeof tab === 'string' ? tab : tab.name}
                        />
                    ))
                }
            </ul>
            <div
                className={
                    tw(
                        'absolute transition-all duration-300 rounded-full',
                        {
                            'bottom-0': !vertical,
                            'right-0': vertical,
                        },
                        underlineClassName,
                    )
                }
                style={styles}
            />
        </Element>
    );
}

export function TabsHolder<Tab extends string> ({ vertical = false, ...props }: TabsHolderProps<Tab>) {
    const [direction, setDirection] = useState<Direction>(Direction.forward);
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [component, setActiveTab] = useTabs({
        tabs: props.tabs,
        components: props.components,
    });

    const handleTabClick = useCallback((index: number) => {
        setDirection(index > activeTabIndex ? Direction.forward : Direction.backward);
        setActiveTab(props.tabs[index]);
        setActiveTabIndex(index);
    }, [activeTabIndex, props.tabs, setActiveTab]);

    return (
        <div className={tw('relative', props.wrapperClassName)}>
            <Tabs
                {...props}
                vertical={vertical}
                onTabClick={handleTabClick}
                activeTabIndex={activeTabIndex}
            />
            <AnimatePresence
                initial={false}
                mode={'popLayout'}
            >
                <motion.div
                    key={activeTabIndex}
                    initial={'enter'}
                    animate={'center'}
                    exit={'exit'}
                    variants={variants}
                    className={tw('flex-1 h-full', props.componentWrapperClassName)}
                    custom={
                        {
                            direction,
                            horizontal: !vertical,
                        }
                    }
                    transition={
                        {
                            x: !vertical
                                ? {
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 30,
                                }
                                : undefined,
                            y: vertical
                                ? {
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 30,
                                }
                                : undefined,
                        }
                    }
                >
                    {component}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
