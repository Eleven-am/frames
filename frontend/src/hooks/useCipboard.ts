import { useCallback } from 'react';

import { notify } from '@/components/toast';

export function useClipboard () {
    const copy = useCallback((value: string, success: string) => {
        navigator.clipboard.writeText(value)
            .then(() => notify({
                success: true,
                content: success,
                browserId: 'clipboard',
                title: 'Copy Successful',
            }))
            .catch((error) => {
                notify({
                    title: 'Copy Failed',
                    content: error.message,
                    browserId: 'clipboard',
                    error: true,
                });
            });
    }, []);

    const paste = useCallback((success: string) => {
        navigator.clipboard.readText()
            .then(() => notify({
                title: 'Paste Successful',
                browserId: 'clipboard',
                content: success,
                success: true,
            }))
            .catch((error) => {
                notify({
                    title: 'Paste Failed',
                    content: error.message,
                    browserId: 'clipboard',
                    error: true,
                });
            });
    }, []);

    return {
        copy,
        paste,
    };
}
