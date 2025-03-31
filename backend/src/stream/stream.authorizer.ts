import { subject } from '@casl/ability';
import {
    WillAuthorize,
    Authorizer,
    RuleBuilder,
    Action,
    AppAbilityType,
    Permission,
    AuthorizationContext
} from '@eleven-am/authorizer';
import { TaskEither, createForbiddenError } from '@eleven-am/fp';
import { User } from '@prisma/client';

import { StreamService } from './stream.service';


@Authorizer()
export class StreamAuthorizer implements WillAuthorize {
    constructor (
        private readonly streamService: StreamService,
    ) {}

    forUser (user: User, { can, cannot }: RuleBuilder): void {
        if (user.revoked || !user.confirmedEmail) {
            cannot(Action.Manage, 'Stream').because('User is not authorised to access the Stream resource');

            return;
        }

        can(Action.Read, 'Stream', {
            userId: user.id,
        });
    }

    authorize (context: AuthorizationContext, ability: AppAbilityType, _: Permission[]) {
        const request = context.getRequest();
        const streamId = request.params.streamId;

        if (streamId === undefined) {
            return TaskEither.of(true);
        }

        return this.streamService.retrieveStreamItem(streamId)
            .filter(
                (streamItem) => ability.can(Action.Read, subject('Stream', streamItem)),
                () => createForbiddenError('User is not authorised to access the Stream resource'),
            )
            .map((streamItem) => {
                request.stream = streamItem;

                return true;
            });
    }
}
