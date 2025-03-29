import { MetadataSchema } from '@/api/data-contracts';
import { FramesChannel } from '@/providers/realtimeNotifier';

type NotificationState = object

export interface SocketNotification {
    title: string;
    content: string;
    image?: string;
    browserId: string;
    error: boolean;
}

export interface SocketAction {
    label: string;
    url?: string;
    mask?: string;
    event?: SocketNotification;
}

export interface SocketActionNotification extends SocketNotification {
    accept: SocketAction;
    decline: SocketAction;
}

type NotificationEventMap = {
    presence: {
        metadata: MetadataSchema | null;
    };
    noResponse: object;
    notification: {
        notification: SocketNotification;
    };
    action: {
        action: SocketActionNotification;
    };
}

class NotificationChannel extends FramesChannel<NotificationState, NotificationEventMap> {
    constructor () {
        super({
        });
    }

    subscribeToNotifications () {
        return this.join('/notifications');
    }

    updatePresence (metadata: MetadataSchema | null) {
        this.sendMessage('presence', {
            metadata,
        });
    }

    sendNotification (notification: SocketNotification) {
        this.sendMessage('notification', {
            notification,
        });
    }
}

const notificationChannel = new NotificationChannel();

export const useNotificationState = notificationChannel.createStateHook();
export const useNotificationActions = notificationChannel.createActionsHook();
export const useNotificationEvents = notificationChannel.createEventsHook();
