import { createParamDecorator } from '@eleven-am/authorizer';
import { OnEvent } from '@eleven-am/pondsocket-nest';
import { UnauthorizedException } from '@nestjs/common';
import { Room } from '@prisma/client';

import { ROOM_DATA_KEY } from './rooms.constants';
import { RoomEventMap } from './rooms.contracts';

export function OnRoomEvent <Event extends keyof RoomEventMap> (event: Event) {
    return OnEvent<RoomEventMap>(event);
}

export const CurrentRoom = createParamDecorator(
    (context) => {
        let room = context.getData<Room>(ROOM_DATA_KEY);

        if (!room) {
            throw new UnauthorizedException('User is not in a room');
        }

        return room;
    },
);
