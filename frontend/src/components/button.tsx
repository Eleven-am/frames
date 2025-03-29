import { useTimer } from '@/hooks/useIntervals';
import { tw } from '@/utils/style';

import * as DropDown from '@radix-ui/react-dropdown-menu';
import * as Popover from '@radix-ui/react-popover';
import { Link, LinkOptions } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { ButtonHTMLAttributes, forwardRef, Fragment, MouseEvent, ReactNode, useCallback, useState } from 'react';


type OmitCommonKeys<T, U> = Omit<T, keyof U>;

export enum ButtonType {
    Light = 'light',
    Dark = 'dark',
    Destructive = 'destructive',
}

export interface DropdownContent {
    onClick: (e: MouseEvent<HTMLButtonElement>) => void;
    Component: ReactNode;
    active?: boolean;
    seperated?: boolean;
    key: string;
}

export interface ButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    title: string;
    children: ReactNode;
}

export interface LinkBaseProps extends OmitCommonKeys<Omit<LinkOptions, 'mask'>, ButtonBaseProps>, ButtonBaseProps {
    mask?: {
        to: string;
    };
}

type BaseProps = (ButtonBaseProps | LinkBaseProps) & {
    count?: number;
    iconRight?: boolean;
    counterClassName?: string;
    holderClassName?: string;
};

export interface BaseButtonProps extends LinkBaseProps {
    count?: number;
    children: ReactNode;
    iconRight?: boolean;
    counterClassName?: string;
    holderClassName?: string;
}

interface StyledButtonProps extends LinkBaseProps {
    title: string;
    primary?: boolean;
    light?: boolean;
    destructive?: boolean;
    noTransition?: boolean;
}

interface PrimaryButtonProps extends Omit<StyledButtonProps, 'primary' | 'children' | 'title'> {
    label: string;
    title?: string;
    children?: ReactNode;
    labelLeft?: boolean;
}

interface RoundedButtonProps extends Omit<StyledButtonProps, 'primary' | 'light' | 'title'> {
    onHover?: (hover: boolean, e: MouseEvent<HTMLButtonElement>) => void;
    title: string;
}

interface DropDownButtonProps extends Omit<BaseButtonProps, 'title' | 'onClick'> {
    Content: ReactNode;
    title?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

interface PopupButtonProps extends Omit<BaseButtonProps, 'title'> {
    title?: string;
    Content: ReactNode;
    onHover?: (hovering: boolean, e: MouseEvent<HTMLButtonElement>) => void;
}

interface DropdownMenuProps {
    title?: string;
    elements: DropdownContent[];
    className?: string;
}

interface NotificationBadgeProps {
    children: ReactNode;
    count?: number;
    className?: string;
    iconRight?: boolean;
    holderClassName?: string;
}

function isLinkButton (props: BaseProps): props is LinkBaseProps {
    const { from, to, activeOptions, mask, params, preload, replace, resetScroll, preloadDelay, search, target, viewTransition } = props as LinkBaseProps;

    return Boolean(from || to || activeOptions || mask || params || preload || replace || resetScroll || preloadDelay || search || target || viewTransition);
}

export function buildButtonClass (type: ButtonType = ButtonType.Dark, primary: boolean = false, noTransition: boolean = false) {
    const base = 'flex items-center justify-center shadow-md shadow-dark-900/40 backdrop-blur-lg hover:scale-110 hover:shadow-lg hover:shadow-dark-900 disabled:pointer-events-none';

    const lightNonHover = 'text-dark-500 fill-dark-500 stroke-dark-500 bg-light-700';
    const lightHover = 'hover:text-dark-900 hover:fill-dark-800 hover:stroke-dark-800 hover:bg-light-600';

    const darkNonHover = 'text-light-700 fill-light-800 stroke-light-800 bg-dark-500';
    const darkHover = 'hover:text-light-800 hover:fill-light-900 hover:stroke-light-900 hover:bg-dark-400';

    const destructiveNonHover = 'text-light-700 fill-light-800 stroke-light-800 bg-red-500/80';
    const destructiveHover = 'hover:text-light-800 hover:fill-light-900 hover:stroke-light-900 hover:bg-red-500';

    const primaryNonHover = 'whitespace-nowrap py-3 px-6 rounded-lg text-md font-bold';
    const roundedNonHover = 'rounded-full p-3';

    const newLight = tw(lightNonHover, lightHover);
    const newDark = tw(darkNonHover, darkHover);
    const newDestructive = tw(destructiveNonHover, destructiveHover);

    const color = tw(base, {
        [newLight]: type === ButtonType.Light,
        [newDark]: type === ButtonType.Dark,
        [newDestructive]: type === ButtonType.Destructive,
    });

    const variable = tw(color, {
        [primaryNonHover]: primary,
        [roundedNonHover]: !primary,
    });

    return tw(variable, {
        'transition-all duration-200 ease-in-out': !noTransition,
    });
}

const ButtonBase = forwardRef<HTMLButtonElement, ButtonBaseProps>(({ children, onClick, ...props }, ref) => {
    const handleClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onClick?.(e);
    }, [onClick]);

    return (
        <button
            {...props}
            ref={ref}
            onClick={handleClick}
        >
            {children}
        </button>
    );
});

const LinkBaseButton = forwardRef<HTMLButtonElement, LinkBaseProps>(({
    from,
    to,
    activeOptions,
    mask,
    params,
    preload,
    replace,
    resetScroll,
    preloadDelay,
    search,
    target,
    viewTransition,
    children,
    ...buttonProps
}, ref) => (
    <Link
        from={from}
        to={to}
        activeOptions={activeOptions}
        mask={mask}
        params={params}
        preload={preload}
        replace={replace}
        resetScroll={resetScroll}
        preloadDelay={preloadDelay}
        search={search}
        target={target}
        viewTransition={viewTransition}
    >
        <button
            {...buttonProps}
            ref={ref}
        >
            {children}
        </button>
    </Link>
));

export function NotificationBadge ({ children, count, className, iconRight = false, holderClassName }: NotificationBadgeProps) {
    if (!count) {
        return (
            <>
                {children}
            </>
        );
    }

    return (
        <div className={tw('relative inline-flex h-full items-center', holderClassName)}>
            {children}
            <span
                className={
                    tw(
                        'absolute w-4 h-4 text-xs bg-green-500 rounded-full top-0.5 flex items-center justify-center text-lightest/100',
                        {
                            '-left-2': !iconRight,
                            '-right-2': iconRight,
                        },
                        className,
                    )
                }
            >
                {count}
            </span>
        </div>
    );
}

export const BaseButton = forwardRef<HTMLButtonElement, BaseProps>((props, ref) => {
    if (isLinkButton(props)) {
        const { children, count, counterClassName, holderClassName, iconRight, ...rest } = props;

        return (
            <NotificationBadge
                count={count}
                iconRight={iconRight}
                className={counterClassName}
                holderClassName={holderClassName}
            >
                <LinkBaseButton {...rest} ref={ref}>
                    {children}
                </LinkBaseButton>
            </NotificationBadge>
        );
    }

    const { children, count, counterClassName, holderClassName, iconRight, ...rest } = props;

    return (
        <NotificationBadge
            count={count}
            iconRight={iconRight}
            className={counterClassName}
            holderClassName={holderClassName}
        >
            <ButtonBase {...rest} ref={ref}>
                {children}
            </ButtonBase>
        </NotificationBadge>
    );
});

const StyledButton = forwardRef<HTMLButtonElement, StyledButtonProps>(({ children, primary, light, noTransition, destructive, className, ...props }, ref) => (
    <BaseButton
        {...props}
        ref={ref}
        className={
            tw(
                buildButtonClass(
                    destructive ? ButtonType.Destructive : light ? ButtonType.Light : ButtonType.Dark,
                    primary,
                    noTransition,
                ),
                className,
            )
        }
    >
        {children}
    </BaseButton>
));

export function PrimaryButton ({ children, label, labelLeft, title, ...props }: PrimaryButtonProps) {
    return (
        <StyledButton {...props} primary title={title || label}>
            {labelLeft ? null : children}
            <span
                className={
                    tw('whitespace-nowrap', {
                        'mr-2': Boolean(labelLeft),
                        'ml-2': !labelLeft && children,
                    })
                }
            >
                {label}
            </span>
            {labelLeft ? children : null}
        </StyledButton>
    );
}

export const RoundedButton = forwardRef<HTMLButtonElement, RoundedButtonProps>(({ children, onHover, onMouseEnter, onMouseLeave, ...props }, ref) => {
    const handleMouseEnter = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        onHover?.(true, e);
        onMouseEnter?.(e);
    }, [onHover, onMouseEnter]);

    const handleMouseLeave = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        onHover?.(false, e);
        onMouseLeave?.(e);
    }, [onHover, onMouseLeave]);

    return (
        <StyledButton {...props} ref={ref} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {children}
        </StyledButton>
    );
});

export const MotionRoundedButton = motion(RoundedButton);

export function DropDownButton ({ children, Content, open, onOpenChange, title, ...props }: DropDownButtonProps) {
    return (
        <DropDown.Root open={open} onOpenChange={onOpenChange}>
            <DropDown.Trigger
                asChild
                className={'focus:outline-none focus:ring-0'}
            >
                <BaseButton
                    {...props}
                    title={title || ''}
                >
                    {Content}
                </BaseButton>
            </DropDown.Trigger>
            <DropDown.Portal>
                <DropDown.Content className={'focus:outline-none focus:ring-0 m-2'}>
                    {children}
                </DropDown.Content>
            </DropDown.Portal>
        </DropDown.Root>
    );
}

export function PopupButton ({ children, Content, onMouseEnter, onMouseLeave, onHover, title, ...props }: PopupButtonProps) {
    const { start, stop } = useTimer();
    const [open, setOpen] = useState(false);

    const handleMouseEnter = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        stop();
        setOpen(true);
        onMouseEnter?.(e);
        onHover?.(true, e);
    }, [onHover, onMouseEnter, stop]);

    const handleMouseLeave = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        start(() => {
            setOpen(false);
            onHover?.(false, e);
        }, 500);
        onMouseLeave?.(e);
    }, [onHover, onMouseLeave, start]);

    const handleMouseEnterContent = useCallback(() => {
        stop();
        setOpen(true);
    }, [stop]);

    const handleMouseLeaveContent = useCallback(() => start(() => setOpen(false), 500), [start]);

    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild className={'focus:outline-none focus:ring-0'}>
                <BaseButton
                    {...props}
                    title={title || ''}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {Content}
                </BaseButton>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    className={'focus:outline-none focus:ring-0'}
                    onMouseEnter={handleMouseEnterContent}
                    onMouseLeave={handleMouseLeaveContent}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    {children}
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}

export function DropdownMenu ({ title, elements, className }: DropdownMenuProps) {
    if (!elements.length) {
        return null;
    }

    return (
        <div
            className={tw('backdrop-blur-lg bg-darkD/60 border border-lightest rounded-md shadow-md flex flex-col items-center justify-center text-lightest text-sm font-medium px-2 mr-2', className)}
        >
            {
                title && (
                    <>
                        <div className={'flex items-center w-full h-8 px-3 rounded-md mt-2'}>
                            <span>{title}</span>
                        </div>
                        <div className={'w-full h-px bg-lightest/20 my-2'} />
                    </>
                )
            }
            {
                elements.map(({ onClick, Component, active, key, seperated }) => (
                    <Fragment key={key}>
                        {seperated && <div className={'w-full h-px bg-lightest/20'} />}
                        <BaseButton
                            title={''}
                            onClick={onClick}
                            data-active={active}
                            holderClassName={'w-full'}
                            className={'flex items-center w-full h-8 px-3 hover:bg-darkL/50 rounded-md cursor-pointer my-2 text-nowrap data-[active="true"]:bg-lightL/20 data-[active="true"]:hover:bg-darkL/50'}
                        >
                            {Component}
                        </BaseButton>
                    </Fragment>
                ))
            }
        </div>
    );
}
