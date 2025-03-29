import { forwardRef, memo, useCallback, useMemo } from 'react';

import { SketchPicker } from 'react-color';
import { FiUsers } from 'react-icons/fi';
import { HiOutlineMail } from 'react-icons/hi';

import { OauthSlimClientSchema } from '@/api/data-contracts';
import { BaseButton, DropDownButton } from '@/components/button';
import { LazyImage } from '@/components/lazyImage';
import { useUserActions } from '@/providers/userProvider';
import { createStyles, rgbToHex } from '@/utils/colour';
import { tw } from '@/utils/style';


interface ButtonBaseProps {
    className: string;
    type: 'button' | 'submit' | 'reset';
    label: string;
    tooltip: string;
    handleClick?: () => void;
    disabled?: boolean;
}

interface OauthButtonProps {
    client: OauthSlimClientSchema;
}

interface OauthBaseButtonProps extends OauthButtonProps {
    onColorChange: (color: string) => void;
}

interface SubmitButtonProps {
    label: string;
    tooltip: string;
    disabled?: boolean;
    onClick?: () => void;
}

const baseClass = 'text-white disabled:cursor-not-allowed disabled:pointer-events-none w-full focus:ring-0 focus:outline-none font-medium rounded-lg text-sm macbook:text-xl px-5 py-2.5 text-center inline-flex items-center justify-center my-2 shadow-black/70 shadow-sm hover:shadow-md hover:shadow-black/80 transition-all duration-200 ease-in-out';

export const AuthButton = memo(forwardRef<HTMLButtonElement, ButtonBaseProps>(({ className, tooltip, handleClick: onClick, ...props }, ref) => {
    const handleClick = useCallback(() => {
        if (onClick) {
            onClick();
        }
    }, [onClick]);

    return (
        <BaseButton
            {...props}
            ref={ref}
            title={tooltip}
            onClick={handleClick}
            className={tw(className, baseClass)}
        >
            <span>{props.label}</span>
        </BaseButton>
    );
}));

export const GuestButton = memo(() => {
    const { continueAsGuest } = useUserActions();

    return (
        <BaseButton
            title={'Continue as guest'}
            onClick={continueAsGuest}
            className={'fixed z-40 top-4 right-4 ipadMini:right-16 ipadMini:top-16 flex items-center justify-center px-4 ipadMini:px-5 py-7 h-10 rounded-full ipadMini:rounded-xl shadow-black/70 shadow-sm hover:shadow-md hover:shadow-black/80 backdrop-blur-lg bg-darkM/50 border border-lightL/60 text-lightest text-lg font-bold transition-all duration-200 ease-in-out hover:bg-darkM hover:text-lightest'}
        >
            <span className={'mr-2 hidden ipadMini:block'}>Continue as guest</span>
            <FiUsers className={'w-6 h-6'} />
        </BaseButton>
    );
});

export function SubmitButton (props: SubmitButtonProps) {
    const { onClick, tooltip, label, disabled } = props;

    const handleClick = useCallback(() => {
        if (onClick) {
            onClick();
        }
    }, [onClick]);

    return (
        <BaseButton
            type={'submit'}
            title={tooltip}
            onClick={handleClick}
            disabled={disabled}
            className={tw(baseClass, 'bg-darkM hover:bg-darkM/90 disabled:text-lightL disabled:bg-darkL/75')}
        >
            <HiOutlineMail className={'w-5 h-5 mr-2'} />
            <span>{label}</span>
        </BaseButton>
    );
}

export function OauthBaseButton ({ client, onColorChange }: OauthBaseButtonProps) {
    const { buttonLabel, logo, color } = client;
    const splitColor = useMemo(() => rgbToHex(color), [color]);

    const manageColor = useCallback(({ rgb }) => {
        const { r, g, b } = rgb;

        const color = `${r}, ${g}, ${b}`;

        onColorChange(color);
    }, [onColorChange]);

    return (
        <DropDownButton
            type={'button'}
            title={'click to change color'}
            style={createStyles(color, [3, 4], true)}
            className={tw(baseClass, 'bg-dark-400 hover:bg-dark-300 disabled:text-lightL disabled:bg-dark-400')}
            Content={
                <>
                    <LazyImage src={logo} alt={buttonLabel} className={'w-5 h-5 mr-2'} />
                    <span>{buttonLabel.toLowerCase()}</span>
                </>
            }
        >
            <SketchPicker color={splitColor} onChange={manageColor} />
        </DropDownButton>
    );
}

export function OauthButton ({ client }: OauthButtonProps) {
    const { buttonLabel, logo, color } = client;
    const { oauthRegister } = useUserActions();
    const handleClick = useCallback(() => oauthRegister(client), [client, oauthRegister]);

    return (
        <BaseButton
            type={'button'}
            title={buttonLabel}
            onClick={handleClick}
            style={createStyles(color, [3, 4], true)}
            className={tw(baseClass, 'bg-dark-400 hover:bg-dark-300 disabled:text-lightL disabled:bg-dark-400')}
        >
            <LazyImage src={logo} alt={buttonLabel} className={'w-5 h-5 mr-2'} />
            <span>{buttonLabel.toLowerCase()}</span>
        </BaseButton>
    );
}
