import { mapTaskEither } from '@eleven-am/authorizer';
import { TaskEither, createTemporaryRedirectError } from '@eleven-am/fp';
import { CanActivate, Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { Request } from 'express';

import { RetrieveService } from '../misc/retrieve.service';

@Injectable()
export class SetupGuard implements CanActivate {
    private readonly logger = new Logger(SetupGuard.name);

    constructor (private readonly retrieveService: RetrieveService) {}

    canActivate (context: ExecutionContext) {
        const request = context.switchToHttp().getRequest<Request>();
        const url = request.url;

        const task = this.retrieveService.isConfigured()
            .matchTask<boolean>(
                [
                    {
                        predicate: (configured) => configured && url.includes('/setup') && !url.includes('/api/setup'),
                        run: () => TaskEither.error(createTemporaryRedirectError('/')),
                    },
                    {
                        predicate: (configured) => !configured && !url.includes('/setup'),
                        run: () => TaskEither.error(createTemporaryRedirectError('/setup')),
                    },
                    {
                        predicate: () => true,
                        run: () => TaskEither.of(true),
                    },
                ],
            );

        return mapTaskEither(task, this.logger);
    }
}
