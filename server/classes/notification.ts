import {Base} from "./auth";
const Phoenix = require("phoenix-channels");

export interface NotificationInterface {
    type?: string;
    title: string;
    message: string;
    opened: boolean;
    sender: string;
    recipient?: string;
    data: any;
}

interface MessageInterface {
    title: string;
    message: string;
    sender: string;
    receiver: string;
    seen: boolean;
    sent: string;
}

export default class Notification extends Base {
    protected readonly socket: any;

    constructor() {
        super();
        if (this.regrouped.tmdbToken?.realTimeApiKey) {
            this.socket = new Phoenix.Socket("wss://real-time.maix.ovh/socket", {params: {apiKey: this.regrouped.tmdbToken.realTimeApiKey}});
            this.socket.connect();
        } else
            this.socket = null;
    }

    /**
     * @desc Gets all notifications for a user
     * @param userId - The user identifier
     */
    public async getNotifications(userId: string): Promise<Omit<NotificationInterface, 'message' | 'data'>[]> {
        const user = await this.prisma.user.findUnique({where: {userId}, include: {notifications: true}});
        if (user) {
            const users = await this.prisma.user.findMany();
            const notifications = user.notifications;
            const now = new Date();

            return notifications.map(notification => {
                const sender = users.find(user => user.userId === notification.senderId);
                const received = this.compareDates(notification.created, now);

                return {
                    title: notification.title,
                    opened: notification.opened, received,
                    sender: sender?.email.split('@')[0] || 'frames AI',
                }
            });
        }

        return [];
    }

    /**
     * @desc Gets a notification by id
     * @param userId - The user identifier
     * @param notificationId - The notification identifier
     */
    public async getNotification(userId: string, notificationId: number): Promise<any> {
        const now = new Date();
        const user = await this.prisma.user.findUnique({where: {userId}});
        const notification = await this.prisma.notification.findUnique({where: {id: notificationId}});

        if (user && notification) {
            const sender = await this.prisma.user.findUnique({where: {userId: notification.senderId}});
            const created = this.compareDates(notification.created, now);
            if (sender !== user) {
                return {
                    title: notification.title,
                    message: notification.message,
                    opened: notification.opened, created,
                    sender: sender?.email.split('@')[0] || 'frames AI',
                }
            }
        }

        return null;
    }

    /**
     * @desc Sends a notification to a user from frames AI or another user
     * @param userId - The user identifier
     * @param message - The message to send
     * @param title - The title of the message
     * @param senderEmail - The email of the sender (optional)
     */
    public async sendMessage(userId: string, message: string, title: string, senderEmail?: string) {
        const user = await this.prisma.user.findUnique({where: {userId}});
        const senderUser = await this.prisma.user.findUnique({where: {email: senderEmail || 'frames AI'}});
        if (user && senderUser) {
            await this.prisma.notification.create({
                data: {
                    message,
                    opened: false,
                    senderId: senderUser.userId, title,
                    receiverId: user.userId,
                },
            });
            const payload: NotificationInterface = {
                sender: senderUser.email.split('@')[0],
                message, opened: false, title, data: null,
            }

            await this.broadCastToUser(user.userId, payload);
        }
    }

    /**
     * @desc broadcasts a notification to all users
     * @param message - The message to send
     * @param title - The title of the message
     * @param payload - Optional data to be sent to the client
     */
    public async informAllUsers(message: string, title: string, payload?: any) {
        const users = await this.prisma.user.findMany();
        const senderUser = await this.prisma.user.findUnique({where: {email: 'frames AI'}});
        if (users && senderUser) {
            const data = {
                message,
                opened: false,
                senderId: senderUser.userId, title,
                receiverId: '',
            }

            const notifications = users.map(user => {
                data.receiverId = user.userId;
                return data;
            });

            await this.prisma.notification.createMany({data: notifications});
            const notification: NotificationInterface = {
                message,
                opened: false,
                sender: senderUser.email.split('@')[0] || 'frames AI',
                title, data: payload
            }
            await this.broadCast(notification);
        }
    }

    /**
     * @desc Marks a notification as opened
     * @param userId - The user identifier
     * @param notificationId - The notification identifier
     */
    public async openNotification(userId: string, notificationId: number): Promise<any> {
        const user = await this.prisma.user.findUnique({where: {userId}});
        const notification = await this.prisma.notification.findUnique({where: {id: notificationId}});
        if (user && notification && user.userId === notification.receiverId) {
            return await this.prisma.notification.update({
                where: {id: notificationId},
                data: {opened: true},
            });
        }

        return null;
    }

    /**
     * @desc Gets all messages a user has sent
     * @param userId - The user identifier
     */
    public async getMessages(userId: string): Promise<Omit<MessageInterface, 'message'>[]> {
        const user = await this.prisma.user.findUnique({where: {userId}});
        if (user) {
            const messages = await this.prisma.notification.findMany({where: {senderId: user.userId}});
            const users = await this.prisma.user.findMany();

            return messages.map(message => {
                const sender = users.find(user => user.userId === message.senderId);
                const receiver = users.find(user => user.userId === message.receiverId);
                const sent = this.compareDates(message.created);

                return {
                   title: message.title,
                   sender: sender?.email.split('@')[0] || 'frames AI',
                   receiver: receiver?.email.split('@')[0] || 'frames AI',
                   seen: message.opened, sent
               };
            });
        }

        return [];
    }

    /**
     * @desc Gets a message from a user
     * @param userId - The user identifier
     * @param messageId - The message identifier
     */
    public async getMessage(userId: string, messageId: number): Promise<MessageInterface | null> {
        const user = await this.prisma.user.findUnique({where: {userId}});
        const message = await this.prisma.notification.findUnique({where: {id: messageId}, include: {sender: true, receiver: true}});
        if (user && message) {
            const sent  = this.compareDates(message.created);

            return {
                title: message.title,
                message: message.message,
                seen: message.opened, sent,
                sender: message.sender.email.split('@')[0] || 'frames AI',
                receiver: message.receiver.email.split('@')[0] || 'frames AI',
            }
        }

        return null;
    }

    /**
     * @desc broadcasts a message to a user from one of its sessions to the others
     * @param session - The session to broadcast the message from
     * @param message - The message to broadcast
     */
    public async broadCastFromSession(session: string, message: NotificationInterface) {
        const state = await this.prisma.session.findUnique({
            where: {session},
            include: {user: {include: {Session: true}}}
        });
        if (state) {
            const payload = {...message, from: `notification:${session}`};
            return await this.push(payload, `notification:${state.user.notificationChannel}`);
        }

        return false;
    }

    /**
     * @desc broadcasts a message to a user
     * @param userId - The user identifier
     * @param message - The message to broadcast
     */
    public async broadCastToUser(userId: string, message: NotificationInterface) {
        const user = await this.prisma.user.findUnique({where: {userId}});
        if (user) {
            const payload = {...message, from: 'homeBase'};
            return await this.push(payload, `notification:${user.notificationChannel}`);
        }
    }

    /**
     * @desc broadcasts a message to all users
     * @param message - The message to broadcast
     */
    public async broadCast(message: NotificationInterface) {
        const channel = `globalNotification:${this.regrouped.user?.notificationId}`;
        await this.push(message, channel);
    }

    /**
     * @desc Pushes a message to a channel
     * @param payload - The message to push
     * @param topic - The channel to push the message to
     */
    private async push<S>(payload: S, topic: string) {
        return await new Promise<boolean>(resolve => {
            const channel = this.socket?.channel(topic, {username: 'homeBase'});
            channel.join()
                .receive("ok", () => {
                    channel.push("shout", payload);
                    resolve(true);
                })
                .receive("error", () => {
                    resolve(false);
                });
        });
    }
}