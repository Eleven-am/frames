import {NotificationInterface} from "../../server/classes/notification";
import {atom, selector, useRecoilState, useRecoilValue, useResetRecoilState, useSetRecoilState} from "recoil";
import useUser, {useGlobalKey} from "./userTools";
import {framesPlayer, framesVideoStateAtom, fullscreenAddressAtom} from "./playback";
import {useChannel} from "./realtime";
import {useRouter} from "next/router";
import {useEffect} from "react";
import {useBase} from "./Providers";
import {useConfirmDispatch, useInfoDispatch} from "../next/components/misc/inform";
import NProgress from "nprogress";

const notificationsAtom = atom({
    key: 'notifications',
    default: [] as NotificationInterface[]
});

export const notificationCount = selector({
    key: 'notificationCount',
    get: ({get}) => {
        const notifications = get(notificationsAtom);
        const unreadNotifications = notifications.filter(notification => !notification.opened);
        const count = unreadNotifications.length;
        return count > 0 ? count > 9 ? '9+' : '' + count : null;
    }
});

export const AlreadyStreamingAtom = atom<{name: string, backdrop: string; episodeName: string | null, logo: string | null} | null>({
    key: 'alreadyStreaming',
    default: null
});

export const useNotification = () => {
    const base = useBase();
    const {user, signOut} = useUser();
    const globalTopic = useGlobalKey();
    const [notifications, setNotifications] = useRecoilState(notificationsAtom);
    const notificationChannel = useChannel(`notification:${user?.channel}`, {username: user?.username || ''});
    const globalChannel = useChannel(`globalNotification:${globalTopic}`, {username: user?.username || ''});

    const connect = () => {
        notificationChannel.connect();
        globalChannel.forceConnect(`globalNotification:${globalTopic}`, {username: user?.username || ''});
    };

    const disconnect = () => {
        notificationChannel.disconnect();
        globalChannel.disconnect();
    };

    const broadcastToSelf = (temp: Omit<NotificationInterface, 'opened' | 'sender'>) => {
        const notification = {...temp, sender: user?.session || '', opened: true};
        notificationChannel.send('speak', notification);
    }

    const signOutEveryWhere = async () => {
        NProgress.start();
        await fetch('/api/auth?action=clearSessions');
        await fetch('midOut');
        broadcastToSelf({type: 'signOut', data: null, message: 'You have been signed out remotely', title: 'Remote sign out'});
        await signOut();
    }


    return {signOutEveryWhere, broadcastToSelf, connect, disconnect, notificationChannel, globalChannel, user, globalTopic, notifications, signOut};
}

export const NotificationHandler = () => {
    const router = useRouter();
    const infoDispatch = useInfoDispatch();
    const confirmDispatch = useConfirmDispatch();
    const videoState = useRecoilValue(framesVideoStateAtom);
    const resetPlayer = useResetRecoilState(framesPlayer);
    const setIsStreaming = useSetRecoilState(AlreadyStreamingAtom);
    const startTime = useRecoilValue(fullscreenAddressAtom).startTime;
    const {user, globalTopic, notificationChannel, globalChannel, connect, disconnect, broadcastToSelf, signOut} = useNotification();

    useEffect(() => {
        if (user && globalTopic)
            connect();
        else
            disconnect();
    }, [user, globalTopic]);

    notificationChannel.subscribe<NotificationInterface>('shout', async data => {
        switch (data.type) {
            case 'streaming':
                const stream = /\/(frame|watch|room)=\w/.test(router.asPath) ;
                if (videoState && stream) {
                    const nData = {
                        name: videoState.name,
                        backdrop: videoState.backdrop,
                        episodeName: videoState.episodeName,
                        logo: videoState.logo,
                        startTime: startTime,
                    };

                    broadcastToSelf({
                        type: 'isStreaming',
                        title: 'Streaming',
                        message: `${startTime}`,
                        recipient: data.sender,
                        data: nData,
                    });
                }
                break;
            case 'isStreaming':
                if (data.data && data.data.startTime < startTime && data.recipient === user?.session)
                    setIsStreaming(data.data);
                break;
            case 'doneStreaming':
                resetPlayer();
                setIsStreaming(null);
                break;
            case 'signOut':
                infoDispatch({
                    type: 'error',
                    heading: data.title,
                    message: data.message,
                })
                await signOut();
                break;
            default:
                break;
        }
    })

    globalChannel.subscribe<NotificationInterface & {type: string}>('shout', data => {

    })

    globalChannel.subscribe<{body: NotificationInterface & {type: string}}>('whisper', async ({body: data}) => {
        switch (data.type) {
            case 'groupWatchInvite':
                confirmDispatch({
                    type: 'user',
                    heading: data.title,
                    message: data.message,
                    confirm: true,
                    confirmText: 'Join',
                    cancelText: 'Decline',
                    onOk: async () => {
                        await router.push(data.data.url);
                    },
                    onCancel: () => {},
                })
               break;
            default:
                break;
        }
    })

    return null;
}