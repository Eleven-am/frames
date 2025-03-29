import { TaskEither } from '@eleven-am/fp';
import { createParamDecorator, ExecutionContext, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { CacheService } from '../cache/cache.service';

import { PageResponse } from './utils.contracts';


export function mapPageResponse<T, U> (fn: (value: T) => U) {
    return (response: PageResponse<T>): PageResponse<U> => ({
        page: response.page,
        totalResults: response.totalResults,
        totalPages: response.totalPages,
        results: response.results.map(fn),
    });
}

export function firstLetterUpperCase (str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function cache<T> ({ key, ttl, store }: { key: string, ttl: number, store: CacheService }) {
    return (value: TaskEither<T>) => store.get<T>(key).orElse(() => value.chain((data) => store.set(key, data, ttl).map(() => data)));
}

export function getHTTPCurrentData <T extends object> (mapper: (data: Request & T) => any, item: string) {
    return createParamDecorator(
        (data: unknown, context: ExecutionContext) => {
            const request = context.switchToHttp().getRequest();
            const mappedData = mapper(request);

            if (!mappedData) {
                throw new NotFoundException(`Could not find ${item}`);
            }

            return mappedData;
        },
    );
}

export function onlyOnProduction () {
    return (value: TaskEither<{ message: string }>): TaskEither<{ message: string }> => {
        return TaskEither
            .fromNullable(process.env.NODE_ENV)
            .matchTask([
                {
                    predicate: (env) => env === 'production',
                    run: () => value,
                },
                {
                    predicate: () => true,
                    run: () => TaskEither.of({ message: 'This route is only available in production' }),
                }
            ])
    };
}
