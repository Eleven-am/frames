import { Result } from '@eleven-am/fp';

export function openWindow <Data> (url: string, title: string) {
    return new Promise<Result<Data>>((resolve) => {
        const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
        const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

        const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
        const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

        const systemZoom = width / window.screen.availWidth;
        const left = (width - 600) / 2 / systemZoom + dualScreenLeft;
        const top = (height - 600) / 2 / systemZoom + dualScreenTop;

        const newWindow = window.open(url, title, `scrollbars=yes, width=600, height=600, top=${top}, left=${left}`);

        if (!newWindow) {
            resolve({
                error: new Error('Could not open window'),
                code: 500,
            });

            return;
        }

        newWindow.focus();

        const interval = setInterval(() => {
            if (newWindow.closed) {
                clearInterval(interval);
                resolve({
                    error: new Error('Window closed'),
                    code: 500,
                });
            }
        }, 1000);

        function listener (event: MessageEvent) {
            if (event.source !== newWindow || !newWindow) {
                return;
            }

            if (event.data.error) {
                resolve({
                    error: event.data.error,
                    code: event.data.code,
                });
            } else {
                resolve({
                    data: event.data,
                });
            }

            clearInterval(interval);
            window.removeEventListener('message', listener);
        }

        window.addEventListener('message', listener);
    });
}
