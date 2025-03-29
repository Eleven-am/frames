import { TaskEither, Either, createBadRequestError } from '@eleven-am/fp';
import { HttpService as BaseHttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { ZodType } from 'zod';

@Injectable()
export class HttpService {
    constructor (private readonly baseHttpService: BaseHttpService) {}

    /**
     * @desc Get data from a url and parse it with a schema
     * @param url - The url to get data from
     * @param schema - The schema to parse the data with
     * @param options - The options to pass to the axios request
     */
    getSafe<DataType> (
        url: string,
        schema: ZodType<DataType>,
        options?: AxiosRequestConfig,
    ): TaskEither<DataType> {
        return TaskEither
            .tryCatch(
                () => this.baseHttpService.axiosRef.get(url, options),
                'Failed to get data',
            )
            .map((response) => Either.of(response.data))
            .chain((response) => response.parseSchema(schema).toTaskEither());
    }

    /**
     * @desc Post data to a url and parse it with a schema
     * @param url - The url to post data to
     * @param schema - The schema to parse the data with
     * @param data - The data to post
     * @param options - The options to pass to the axios request
     */
    postSafe<DataType> (
        url: string,
        schema: ZodType<DataType>,
        data: unknown,
        options?: AxiosRequestConfig,
    ): TaskEither<DataType> {
        return TaskEither
            .tryCatch(
                () => this.baseHttpService.axiosRef.post(url, data, options),
                'Failed to post data',
            )
            .map((response) => Either.of(response.data))
            .chain((response) => response.parseSchema(schema).toTaskEither());
    }

    /**
     * @desc Get data from a url
     * @param url - The url to get data from
     * @param options - The options to pass to the axios request
     */
    apiGet<T> (url: string, options?: AxiosRequestConfig) {
        return TaskEither
            .tryCatch(
                () => this.baseHttpService.axiosRef.get(url, options),
                'Failed to get data',
            )
            .filter(
                (response) => response.status === 200,
                () => createBadRequestError('Failed to get data'),
            )
            .map((response) => response.data as T);
    }
}
