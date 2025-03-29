import { toast } from 'sonner';

import { LazyImage } from '@/components/lazyImage';
import { tw } from '@/utils/style';

interface SocketNotification {
    title: string;
    content: string;
    image?: string;
    browserId: string;
    error: boolean;
}

interface ToastNotificationProps extends Omit<SocketNotification, 'error'> {
    error?: boolean;
    success?: boolean;
}

function ToastNotification ({ title, content, image, error, success }: ToastNotificationProps) {
    return (
        <div
            className={
                tw('bg-dark-600 p-4 rounded-lg shadow-dark-800 shadow-md', {
                    'bg-red-600': error,
                    'bg-green-600': success,
                })
            }
        >
            <h2
                className={
                    tw('text-light-900 text-lg', {
                        'text-white': error || success,
                    })
                }
            >
                {title}
            </h2>
            <p
                className={
                    tw('text-light-900/80 text-sm', {
                        'text-white/80': error || success,
                    })
                }
            >
                {content}
            </p>
            {
                image && (
                    <LazyImage src={image} alt={title} className={'w-full aspect-video object-cover rounded-lg mt-4'} />
                )
            }
        </div>
    );
}

export function notify (notification: ToastNotificationProps) {
    toast(
        <ToastNotification {...notification} />,
    );
}
