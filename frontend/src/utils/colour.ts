import { CSSProperties } from 'react';

function generateRGBColor (input: string): string {
    const normalizedInput = input.toLowerCase().replace(/[^a-z0-9]/g, '');
    const seed = normalizedInput.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const random = (seed: number): number => {
        const x = Math.sin(seed) * 10000;

        return x - Math.floor(x);
    };

    const r = Math.floor(random(seed) * 256);
    const g = Math.floor(random(seed + 1) * 256);
    const b = Math.floor(random(seed + 2) * 256);

    return `${r}, ${g}, ${b}`;
}

function darkenColor (rgb: string, percentage: number): string {
    let [r, g, b] = rgb.split(',').map((x) => parseInt(x, 10));
    const amt = Math.abs(percentage) / 100;

    r = Math.floor(r * (1 - amt));
    g = Math.floor(g * (1 - amt));
    b = Math.floor(b * (1 - amt));

    return `${r}, ${g}, ${b}`;
}

function lightenColor (rgb: string, percentage: number): string {
    let [r, g, b] = rgb.split(',').map((x) => parseInt(x, 10));
    const amt = Math.abs(percentage) / 100;

    r = Math.floor(r + (255 - r) * amt);
    g = Math.floor(g + (255 - g) * amt);
    b = Math.floor(b + (255 - b) * amt);

    return `${r}, ${g}, ${b}`;
}

export function rgbToHex (rgb: string): string {
    const [r, g, b] = rgb.split(',').map((x) => parseInt(x, 10));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function createStyles (blur: string, range: number[] = [], darkMode: boolean | null = null): CSSProperties {
    const percentage = range.length
        ? range
        : Array.from({
            length: 10,
        }, (_, i) => i + 1)
            .filter((x) => x !== 10);

    const mapped = percentage.map((x) => ({
        name: `${Math.round(x * 100)}`,
        value: x,
    }));

    const theme: Record<string, string> = {
    };

    mapped.forEach((percentage) => {
        if (darkMode === null) {
            theme[`--light-${percentage.name}`] = lightenColor(blur, Math.round(percentage.value * 10));
            theme[`--dark-${percentage.name}`] = darkenColor(blur, Math.round(percentage.value * 10));
        } else if (darkMode) {
            theme[`--dark-${percentage.name}`] = darkenColor(blur, Math.round(percentage.value * 10));
        } else {
            theme[`--light-${percentage.name}`] = lightenColor(blur, Math.round(percentage.value * 10));
        }
    });

    return theme;
}

export function createStylesFromSeed (seed: string, range: number[] = [], darkMode: boolean | null = null): CSSProperties {
    return createStyles(generateRGBColor(seed), range, darkMode);
}

export function generateCompleteStyles (posterBlur: string, backdropBlur: string, logoBlur: string | null): CSSProperties {
    const styles: any = createStyles(backdropBlur);

    const stripLastComa = (x: string) => x.replace(/,$/, '');

    styles['--poster-blur'] = stripLastComa(posterBlur);
    styles['--backdrop-blur'] = stripLastComa(backdropBlur);

    if (logoBlur) {
        styles['--logo-blur'] = stripLastComa(logoBlur);
    }

    return styles;
}
