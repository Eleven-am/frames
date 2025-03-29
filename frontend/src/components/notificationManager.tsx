import { ReactNode, useCallback } from 'react';

import { useRouter } from '@tanstack/react-router';
import { Toaster } from 'sonner';

import { notify } from '@/components/toast';
import { useBlurState } from '@/providers/blurProvider';
import { DialogButtonAction, useDialogActions } from '@/providers/dialogStore';
import { SocketAction, useNotificationActions, useNotificationEvents } from '@/providers/notificationChannel';
import { useUser } from '@/providers/userProvider';
import { createStyles } from '@/utils/colour';


interface NotificationManagerProps {
    children: ReactNode;
}

export function NotificationManager ({ children }: NotificationManagerProps) {
    const router = useRouter();
    const { createDialog } = useDialogActions();
    const blur = useBlurState((state) => state.blur);
    const { sendNotification } = useNotificationActions();
    const username = useUser((state) => state.session?.username ?? '');

    useNotificationEvents('notification', ({ notification }) => notify(notification));

    const mapAction = useCallback((action: SocketAction): DialogButtonAction => ({
        label: action.label,
        onClick: async () => {
            if (action.url) {
                await router.navigate({
                    to: action.url,
                    mask: action.mask
                        ? {
                            to: action.mask,
                        }
                        : undefined,
                });
            }

            if (action.event) {
                sendNotification({
                    error: action.event.error,
                    image: action.event.image,
                    title: action.event.title,
                    browserId: action.event.browserId,
                    content: `${username} ${action.event.content}`,
                });
            }
        },
    }), [router, sendNotification, username]);

    useNotificationEvents('action', ({ action }) => {
        createDialog({
            title: action.title,
            content: action.content,
            acceptAction: mapAction(action.accept),
            declineAction: mapAction(action.decline),
        });
    });

    return (
        <>
            {children}
            <div style={createStyles(blur)}>
                <Toaster
                    position={'top-right'}
                    toastOptions={
                        {
                            unstyled: true,
                            className: 'right-0',
                        }
                    }
                />
            </div>
        </>
    );
}

