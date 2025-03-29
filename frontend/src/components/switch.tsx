import { ComponentProps } from 'react';

import { Switch as AriaSwitch } from 'react-aria-components';

type SwitchProps = ComponentProps<typeof AriaSwitch>;

export function Switch ({ ...props }: SwitchProps) {
    return (
        <AriaSwitch
            {...props}
            className="group inline-flex touch-none items-center"
            style={
                {
                    WebkitTapHighlightColor: 'transparent',
                }
            }
        >
            <span className={'group-data-[selected]:bg-lightD group-data-[disabled]:opacity-70 group-data-[disabled]:cursor-default group-data-[focus-visible]:ring-2 h-6 w-9 cursor-pointer rounded-full border-2 border-transparent bg-lightL/30 ring-offset-2 ring-offset-zinc-900 transition duration-200'}>
                <span className="group-data-[selected]:ml-3 group-data-[selected]:group-data-[pressed]:ml-2 group-data-[pressed]:w-6 block h-5 w-5 origin-right rounded-full bg-lightest shadow transition-all duration-200" />
            </span>
        </AriaSwitch>
    );
}


