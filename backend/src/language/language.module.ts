import { Global, Module } from '@nestjs/common';

import { LanguageAuthorizer } from './language.authorizer';
import { LanguageService } from './language.service';

@Global()
@Module({
    imports: [],
    providers: [LanguageService, LanguageAuthorizer],
    exports: [LanguageService],
})
export class LanguageModule {}
