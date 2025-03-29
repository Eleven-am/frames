import { accessibleBy } from '@casl/prisma';
import {
    WillAuthorize,
    Authorizer,
    sortActions,
    RuleBuilder,
    Action,
    AppAbilityType,
    Permission,
} from '@eleven-am/authorizer';
import { TaskEither, createForbiddenError } from '@eleven-am/fp';
import { Context } from '@eleven-am/pondsocket-nest';
import { ExecutionContext } from '@nestjs/common';
import { User, AccessPolicy } from '@prisma/client';

import { ROOM_DATA_KEY } from './rooms.constants';
import { RoomAssigns, RoomData } from './rooms.contracts';
import { MediaAuthorizer } from '../media/media.authorizer';
import { PrismaService } from '../prisma/prisma.service';


@Authorizer()
export class RoomsAuthorizer implements WillAuthorize {
    constructor (
        private readonly prisma: PrismaService,
    ) {}

    forUser (user: User, { can, cannot }: RuleBuilder) {
        if (user.revoked || !user.confirmedEmail) {
            cannot(Action.Manage, 'Room').because('User is not authorised to access the Room resource');
        }

        can(Action.Read, 'Room', {
            view: {
                video: {
                    media: MediaAuthorizer.getQuery(user, AccessPolicy.READ),
                },
            },
        });

        can(Action.Manage, 'Room', {
            AND: [
                {
                    view: {
                        userId: user.id,
                    },
                },
                {
                    view: {
                        video: {
                            media: MediaAuthorizer.getQuery(user, AccessPolicy.READ),
                        },
                    },
                },
            ],
        });
    }

    checkHttpAction (ability: AppAbilityType, rules: Permission[], context: ExecutionContext): TaskEither<boolean> {
        const request = context.switchToHttp().getRequest();
        const roomRules = rules.filter((rule) => rule.resource === 'Room');
        const [leastPermissive] = sortActions(roomRules.map((rule) => rule.action));
        const roomId = request.params.roomId;

        if (roomId === undefined && (leastPermissive === undefined || leastPermissive === Action.Create)) {
            return TaskEither.of(true);
        }

        return this.validateRoom(ability, roomId, leastPermissive)
            .ioSync((room) => {
                request.room = room;
            })
            .map(() => true);
    }

    checkSocketAction (ability: AppAbilityType, rules: Permission[], context: Context<'/:roomId', unknown, RoomAssigns>): TaskEither<boolean> {
        const roomId = context.event?.params?.roomId ?? context.user?.assigns.roomId ?? null;
        const roomRules = rules.filter((rule) => rule.resource === 'Room');
        const [leastPermissive] = sortActions(roomRules.map((rule) => rule.action));

        if (roomId === null && (leastPermissive === undefined || leastPermissive === Action.Create)) {
            return TaskEither.of(true);
        }

        return this.validateRoom(ability, roomId, leastPermissive)
            .ioSync((room) => context.addData(ROOM_DATA_KEY, room))
            .map(() => true);
    }

    private validateRoom (ability: AppAbilityType, roomId: string | null, leastPermissive: Action = Action.Read): TaskEither<RoomData> {
        if (roomId === null) {
            return TaskEither.error<RoomData>(createForbiddenError('Room ID is required'));
        }

        return TaskEither
            .tryCatch(
                () => this.prisma.room.findFirst({
                    where: {
                        AND: [
                            {
                                id: roomId,
                            },
                            accessibleBy(ability, leastPermissive).Room,
                        ],
                    },
                    include: {
                        view: {
                            include: {
                                video: {
                                    include: {
                                        media: true,
                                    },
                                },
                            },
                        },
                    },
                }),
            )
            .nonNullable('Room not found');
    }
}


