import { mapTaskEither } from '@eleven-am/authorizer';
import { TaskEither } from '@eleven-am/fp';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { from, of, switchMap } from 'rxjs';


@Injectable()
export class FramesInterceptor implements NestInterceptor {
    private readonly logger = new Logger(FramesInterceptor.name);

    intercept (_: ExecutionContext, next: CallHandler) {
        return next.handle()
            .pipe(switchMap((value) => this.project(value)))
    }

    private project (value: any) {
        if (value instanceof TaskEither) {
            return from(mapTaskEither(value, this.logger));
        }

        return of(value);
    }
}
