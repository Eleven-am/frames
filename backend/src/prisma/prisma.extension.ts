import { shuffle } from '@eleven-am/fp';
import { Prisma, PrismaClient } from '@prisma/client';

import { PageResponse } from '../utils/utils.contracts';

type PaginateParams<T, A> = Prisma.Exact<A, Omit<Prisma.Args<T, 'findMany'>, 'skip' | 'take'>> & {
    paginate?: {
        page?: number;
        pageSize?: number;
    };
}

type ArrayType<T> = T extends Array<infer U> ? U : never;

type RandomParams<T, A> = Prisma.Exact<A, Prisma.Args<T, 'findMany'>> & {
    length?: number;
}

export function extendPrisma (datasourceUrl: string) {
    return new PrismaClient({
        datasources: {
            db: {
                url: datasourceUrl,
            },
        },
    })
        .$extends({
            model: {
                $allModels: {
                    async paginate<T, A> (this: T, params: PaginateParams<T, A>) {
                        const { paginate, ...args } = params as any;

                        const page = paginate?.page || 1;
                        const pageSize = paginate?.pageSize || 10;
                        const skip = (page - 1) * pageSize;

                        const context = Prisma.getExtensionContext(this);

                        const [data, total]: [Prisma.Result<T, A, 'findMany'>, number] = await Promise.all([
                            (context as any).findMany({
                                ...args,
                                skip,
                                take: pageSize,
                            }),
                            (context as any).count({ where: args.where }),
                        ]);

                        const result: PageResponse<ArrayType<Prisma.Result<T, A, 'findMany'>>> = {
                            page,
                            totalResults: total,
                            totalPages: Math.ceil(total / pageSize),
                            results: data as ArrayType<Prisma.Result<T, A, 'findMany'>>[],
                        };

                        return result;
                    },

                    async random<T, A> (this: T, params: RandomParams<T, A>) {
                        const { length, ...args } = params as any;

                        const context = Prisma.getExtensionContext(this);

                        const data = await (context as any).findMany(args);

                        return shuffle(data, length) as Prisma.Result<T, A, 'findMany'>;
                    },
                },
            },
        });
}

export type ExtendedPrisma = ReturnType<typeof extendPrisma>;
