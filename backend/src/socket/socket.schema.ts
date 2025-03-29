import type { PondAssigns, PondPresence } from '@eleven-am/pondsocket/types';
import { ApiProperty } from '@nestjs/swagger';

export enum PresenceAction {
    BROWSING = 'BROWSING',
    WATCHING = 'WATCHING',
    AWAY = 'AWAY',
}

export interface MetaData {
    name: string;
    overview: string | null;
    action: PresenceAction;
    poster: string;
    backdrop: string;
    logo: string | null;
    backdropBlur: string;
}

export interface PresenceInterface<DataType> extends PondPresence {
    username: string;
    status: string;
    channel: string;
    browserId: string;
    isIncognito: boolean;
    metadata: DataType | null;
    onlineAt: number;
}

export interface Assigns extends PondAssigns {
    token: string;
    browserId: string;
}

export class MetadataSchema {
    @ApiProperty({
        type: String,
        description: 'The name of the media',
    })
    name: string;

    @ApiProperty({
        type: String,
        description: 'The backdrop of the media',
        format: 'uri',
    })
    backdrop: string;

    @ApiProperty({
        type: String,
        description: 'The poster of the media',
        format: 'uri',
    })
    poster: string;

    @ApiProperty({
        type: String,
        description: 'The overview of the media',
        nullable: true,
    })
    overview: string | null;

    @ApiProperty({
        type: String,
        description: 'The logo of the media',
        nullable: true,
        format: 'uri',
    })
    logo: string | null;

    @ApiProperty({
        type: String,
        description: 'The backdrop blur of the media',
    })
    backdropBlur: string;

    @ApiProperty({
        type: String,
        description: 'The action of the user',
        'enum': Object.values(PresenceAction),
        enumName: 'PresenceAction',
    })
    action: PresenceAction;

    @ApiProperty({
        type: String,
        description: 'The playback id the user is currently watching',
        nullable: true,
    })
    playbackId: string | null;

    @ApiProperty({
        type: String,
        description: 'The media id of the media',
    })
    mediaId: string;
}
