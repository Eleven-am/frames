import { clsx, ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const tw = (...classes: ClassValue[]) => twMerge(clsx(classes));

export function isMobileDevice () {
    if (typeof navigator === 'undefined') {
        return false;
    }

    const userAgent = navigator.userAgent.toLowerCase();

    return (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i).test(userAgent);
}
