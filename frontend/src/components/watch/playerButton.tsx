import { ReactNode } from 'react';

import { BaseButtonProps, BaseButton, DropDownButton, PopupButton } from '@/components/button';
import { tw } from '@/utils/style';


interface PlayerButtonProps extends BaseButtonProps {
    isActivated?: boolean;
    isDeactivated?: boolean;
}

interface DropDownPlayerButtonProps extends PlayerButtonProps {
    Content: ReactNode;
    onOpenChange?: (open: boolean) => void;
}

interface PopupPlayerButtonProps extends PlayerButtonProps {
    Content: ReactNode;
    onHover?: (hovering: boolean) => void;
}

function playerButtonClass (className?: string, isActivated?: boolean, isDeactivated?: boolean) {
    return tw('text-lightL/75 hover:text-lightL hover:scale-110 group transition-all duration-200 ease-in-out', className, {
        'text-green-500/75 hover:text-green-500': isActivated,
        'text-red-500/75 hover:text-red-500': isDeactivated,
    });
}

export function PlayerButton ({ isActivated, isDeactivated, className, children, ...props }: PlayerButtonProps) {
    return (
        <BaseButton
            {...props}
            className={playerButtonClass(className, isActivated, isDeactivated)}
        >
            {children}
        </BaseButton>
    );
}

export function DropDownPlayerButton ({ Content, isActivated, isDeactivated, onOpenChange, className, children, ...props }: DropDownPlayerButtonProps) {
    return (
        <DropDownButton
            {...props}
            Content={Content}
            onOpenChange={onOpenChange}
            className={playerButtonClass(className, isActivated, isDeactivated)}
        >
            {children}
        </DropDownButton>
    );
}

export function PopupPlayerButton ({ Content, isActivated, isDeactivated, className, children, ...props }: PopupPlayerButtonProps) {
    return (
        <PopupButton
            {...props}
            Content={Content}
            className={playerButtonClass(className, isActivated, isDeactivated)}
        >
            {children}
        </PopupButton>
    );
}
