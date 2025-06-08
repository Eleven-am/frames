import { mapTaskEither } from '@eleven-am/authorizer';
import { createTemporaryRedirectError } from '@eleven-am/fp';
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Role } from '@prisma/client';

import { SessionService } from '../session/session.service';

@Injectable()
export class StreamGuard implements CanActivate {
    private readonly logger = new Logger(StreamGuard.name);

    constructor (private readonly sessionService: SessionService) {}

    canActivate (context: ExecutionContext) {
        const task = this.sessionService.retrieveUserFromExecutionContext(context)
            .filter(
                (user) => user.role !== Role.GUEST,
                () => createTemporaryRedirectError('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'),
            )
            .map(() => true);

        return mapTaskEither(task, this.logger);
    }
}
