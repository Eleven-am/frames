import {WillAuthorize, Authorizer, AppAbilityType, Permission, AuthorizationContext} from '@eleven-am/authorizer';
import { TaskEither, createNotFoundError } from '@eleven-am/fp';

import { LanguageService } from './language.service';
@Authorizer()
export class LanguageAuthorizer implements WillAuthorize {
    constructor (private readonly languageService: LanguageService) {}

    forUser () {}

    authorize (context: AuthorizationContext, _: AppAbilityType, __: Permission[]) {
        if (context.isSocket) {
            return TaskEither.of(true);
        }

        const request = context.getRequest();
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

