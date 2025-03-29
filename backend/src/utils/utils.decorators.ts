import { HttpExceptionSchema } from '@eleven-am/authorizer';
import { applyDecorators } from '@nestjs/common';
import {
    ApiCreatedResponse,
    ApiOkResponse,
    ApiParam,
    ApiNotFoundResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FramesGenericResponseSchema } from './utils.contracts';

export const ApiParamId = (param: string, description: string) => applyDecorators(
    ApiParam({
        description: `The id of the ${param} item ${description}`,
        name: `${param}Id`,
        type: String,
    }),
);

export const ApiOkFramesResponse = (description: string) => ApiOkResponse({
    description,
    type: FramesGenericResponseSchema,
});

export const ApiCreatedFramesResponse = (description: string) => ApiCreatedResponse({
    description,
    type: FramesGenericResponseSchema,
});

export function ApiNotFoundException (description: string) {
    return applyDecorators(
        ApiNotFoundResponse({
            description,
            type: HttpExceptionSchema,
        }),
    );
}

export function ApiUnauthorizedException (description: string) {
    return applyDecorators(
        ApiUnauthorizedResponse({
            description,
            type: HttpExceptionSchema,
        }),
    );
}
