import {WillAuthorize, Authorizer, AppAbilityType, Permission, AuthorizationContext} from '@eleven-am/authorizer';
import { TaskEither, createNotFoundError } from '@eleven-am/fp';

import { LanguageService } from './language.service';
import { LanguageReturn } from "./language.types";

@Authorizer()
export class LanguageAuthorizer implements WillAuthorize {
    constructor (private readonly languageService: LanguageService) {}

    forUser () {}

    authorize (context: AuthorizationContext, _: AppAbilityType, __: Permission[]) {
        const request = context.getRequest<{ headerLang: LanguageReturn, lang: LanguageReturn }>();
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

