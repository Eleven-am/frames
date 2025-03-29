
import { forwardRef, ElementRef, ComponentPropsWithoutRef } from 'react';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { FaCheck } from 'react-icons/fa6';

import { tw } from '@/utils/style';


const Checkbox = forwardRef<
    ElementRef<typeof CheckboxPrimitive.Root>,
    ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
        ref={ref}
        {...props}
        className={
            tw(
                'peer h-5 w-5 shrink-0 rounded-sm border border-lightest ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )
        }
    >
        <CheckboxPrimitive.Indicator
            className={tw('flex items-center justify-center text-current')}
        >
            <FaCheck className="h-4 w-4" />
        </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
));

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
