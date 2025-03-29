import { RedirectException } from '@eleven-am/authorizer';
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

@Catch(RedirectException)
export class RedirectFilter implements ExceptionFilter {
    public catch (exception: RedirectException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        return exception.handle(response);
    }
}
