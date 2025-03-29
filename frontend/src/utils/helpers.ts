import { intervalToDuration } from 'date-fns';

export function clamp (value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

export function weightedRandom<B extends keyof A, A extends { [p: string]: number }> (spec: A): B | 'none' {
    let sum = 0;
    const r = Math.random();

    // eslint-disable-next-line guard-for-in
    for (const key in spec) {
        sum += spec[key];
        if (r <= sum) {
            return key as any as B;
        }
    }

    return 'none';
}

export function sleep (ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function firstLetterToUpperCase (word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function deepCompare (firstObject: any, secondObject: any): boolean {
    if (firstObject === secondObject) {
        return true;
    }

    if (firstObject instanceof Date && secondObject instanceof Date) {
        return firstObject.getTime() === secondObject.getTime();
    }

    if (Array.isArray(firstObject) && Array.isArray(secondObject)) {
        if (firstObject.length !== secondObject.length) {
            return false;
        }

        return firstObject.every((item, index) => deepCompare(item, secondObject[index]));
    }

    if (firstObject && secondObject && typeof firstObject === 'object' && typeof secondObject === 'object') {
        if (firstObject.constructor !== secondObject.constructor) {
            return false;
        }
        const properties = Object.keys(firstObject);

        if (properties.length !== Object.keys(secondObject).length) {
            return false;
        }

        return properties.every((prop) => deepCompare(firstObject[prop], secondObject[prop]));
    }


    return false;
}

export function toDuration (start: number, end: number) {
    if (isNaN(start) || isNaN(end) || (start === 0 && end === 0)) {
        return '00:00';
    }

    const duration = intervalToDuration({
        start: start * 1000,
        end: end * 1000,
    });

    const zeroPad = (num: number | undefined) => String(num ?? 0)
        .padStart(2, '0');

    const seconds = zeroPad(duration.seconds);
    const minutes = zeroPad(duration.minutes);

    const current = `${minutes}:${seconds}`;

    if (duration.hours && duration.hours > 0) {
        return `${duration.hours}:${current}`;
    }

    return current;
}

export function getBaseUrl() {
    if (typeof window === 'undefined' || !window.location) {
        throw new Error('This function can only be used in a browser environment');
    }

    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;

    return `${protocol}//${hostname}${port ? ':' + port : ''}`;
}

export function generateRandomCypher() {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const allChars = lowercase + uppercase + digits;

    const randomLower = lowercase[Math.floor(Math.random() * lowercase.length)];
    const randomUpper = uppercase[Math.floor(Math.random() * uppercase.length)];

    const remainingChars = Array.from(
        { length: 11 },
        () => allChars[Math.floor(Math.random() * allChars.length)]
    ).join('');

    return (randomLower + randomUpper + remainingChars)
        .split('')
        .sort(() => 0.5 - Math.random())
        .join('');
}
