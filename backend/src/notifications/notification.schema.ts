import { PondResponse } from '@eleven-am/pondsocket-nest';
import { Notification } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsUUID, IsObject, ValidateNested, IsBoolean } from 'class-validator';

import { MetaData, PresenceInterface, Assigns } from '../socket/socket.schema';

export type NotificationEventMap = {
    presence: {
        metadata: MetaData | null;
    };
    noResponse: object;
    notification: {
        notification: SocketNotification;
    };
    action: {
        action: SocketActionNotification;
    };
}

export interface SendMailParams {
    to: string;
    html: string;
    subject: string;
}

export type NotificationReturnType<Event extends keyof NotificationEventMap> =
  PondResponse<NotificationEventMap, Event, PresenceInterface<MetaData>, Assigns>;

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

export interface LogStream {
    time: number;
    message: string;
    url?: string;
}

export interface SocketActionNotification extends SocketNotification {
    accept: SocketAction;
    decline: SocketAction;
}

export type NotificationData = Omit<Notification, 'id' | 'created' | 'updated' | 'opened'>;

class SocketNotificationSchema {
    @IsString()
    title: string;

    @IsString()
    content: string;

    @IsString()
    @IsOptional()
    image?: string;

    @IsString()
    @IsUUID()
    browserId: string;

    @IsBoolean()
    error: boolean;
}

class SocketActionSchema {
    @IsString()
    label: string;

    @IsString()
    @IsOptional()
    url?: string;

    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => SocketNotificationSchema)
    event?: SocketNotificationSchema;
}

class SocketActionNotificationSchema extends SocketNotificationSchema {
    @IsObject()
    @ValidateNested()
    @Type(() => SocketActionSchema)
    accept: SocketActionSchema;

    @IsObject()
    @ValidateNested()
    @Type(() => SocketActionSchema)
    decline: SocketActionSchema;
}

export class NotificationSchema {
    @IsObject()
    @ValidateNested()
    @Type(() => SocketNotificationSchema)
    notification: SocketNotificationSchema;
}

export class ActionSchema {
    @IsObject()
    @ValidateNested()
    @Type(() => SocketActionNotificationSchema)
    action: SocketActionNotificationSchema;
}
