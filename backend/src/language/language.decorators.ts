import { applyDecorators } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';

import { LanguageReturn } from './language.types';
import { getHTTPCurrentData } from '../utils/helper.fp';


export const CurrentLanguage = getHTTPCurrentData<{ lang: LanguageReturn }>(
    (request) => request.lang,
    'Language',
);

export const ApiLanguage = () => applyDecorators(
    ApiParam({
        description: 'The language to select',
        name: 'language',
        type: String,
    }),
);
