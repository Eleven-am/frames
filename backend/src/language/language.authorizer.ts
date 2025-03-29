import { WillAuthorize, Authorizer, AppAbilityType, Permission } from '@eleven-am/authorizer';
import { TaskEither, createNotFoundError } from '@eleven-am/fp';
import { ExecutionContext } from '@nestjs/common';

import { LanguageService } from './language.service';


@Authorizer()
export class LanguageAuthorizer implements WillAuthorize {
    constructor (private readonly languageService: LanguageService) {}

    forUser () {}

    checkHttpAction (_: AppAbilityType, __: Permission[], context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const language = request.params.language;
        const headerLanguage = request.headers['accept-language'] || '';

        request.headerLang = this.languageService.getLanguage(headerLanguage);

        if (language === undefined) {
            return TaskEither.of(true);
        }

        if (!this.languageService.languageExists(language)) {
            return TaskEither.error<boolean>(createNotFoundError('Language not found'));
        }

        request.lang = this.languageService.getLanguage(language);

        return TaskEither.of(true);
    }
}

