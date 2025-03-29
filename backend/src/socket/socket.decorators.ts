import { createParamDecorator } from '@eleven-am/pondsocket-nest';
import { BadRequestException } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export function GetValidPayload () {
    return createParamDecorator<void, ClassConstructor<any>>(async (data, context, dto) => {
        const payload = context.event?.payload ?? {};
        const objInstance = plainToInstance(dto, payload);
        const errors = await validate(objInstance);

        if (errors.length) {
            throw new BadRequestException(errors);
        }

        return objInstance;
    })();
}
