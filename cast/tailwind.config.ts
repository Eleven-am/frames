import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

function withOpacity (variableName: string) {
    return ({ opacityValue }: { opacityValue?: number }) => {
        if (opacityValue !== undefined) {
            return `rgba(var(${variableName}), ${opacityValue})`;
        }

        return `rgb(var(${variableName}))`;
    };
}

function createTheme () {
    const percentage = Array.from({
        length: 10,
    }, (_, i) => i + 1)
        .filter((x) => x !== 10)
        .map((x) => ({
            name: `${Math.round(x * 100)}`,
            value: x,
        }));

    const theme: Record<string, unknown> = {
    };

    percentage.forEach((percentage) => {
        theme[`light-${percentage.name}`] = withOpacity(`--light-${percentage.name}`);
        theme[`dark-${percentage.name}`] = withOpacity(`--dark-${percentage.name}`);
    });

    theme['backdrop-blur'] = withOpacity('--backdrop-blur');
    theme['logo-blur'] = withOpacity('--logo-blur');
    theme['poster-blur'] = withOpacity('--poster-blur');

    return theme as Record<string, string>;
}

const config: Config = {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        screens: {
            iphoneSE: '320px',
            iphone8: '375px',
            iphonePlus: '414px',
            iphone14: '480px',
            ipadMini: '1024px',
            ipadPro: '1112px',
            macbook: '1366px',
            imac: '1440px',
            imacPro: '1680px',
            fullHD: '1920px',
            imacProMax: '2048px',
        },
        extend: {
            colors: {
                ...createTheme(),
                darkD: '#01101C',
                darkM: '#052E51',
                darkL: '#225D90',
                lightD: '#4B7BAB',
                lightM: '#7BA4CC',
                lightL: '#A5BCD9',
                lightest: '#D9EEFF',
            },
            textShadow: {
                none: 'none',
                sm: '0 1px 2px var(--tw-shadow-color)',
                md: '0 2px 4px var(--tw-shadow-color)',
                lg: '0 8px 16px var(--tw-shadow-color)',
                xl: '0 16px 24px var(--tw-shadow-color)',
                DEFAULT: '0 4px 8px var(--tw-shadow-color)',
            },
            fontFamily: {
                frames: ['"Baloo 2"', 'sans-serif'],
            },
        },
    },
    plugins: [
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('tailwind-scrollbar-hide'),
        plugin(({ matchUtilities, theme }) => {
            matchUtilities(
                {
                    'text-shadow': (value) => ({
                        textShadow: value,
                    }),
                },
                {
                    values: theme('textShadow'),
                },
            );
        }),
    ],
};

export default config;
