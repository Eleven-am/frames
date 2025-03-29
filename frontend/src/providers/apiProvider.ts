import { Result } from '@eleven-am/fp';
import { EventNotifier, Notifier } from '@eleven-am/notifier';

import { Api } from '@/api/Api';
import { HttpExceptionSchema } from '@/api/data-contracts';
import { HttpResponse } from '@/api/http-client';
import { notify } from '@/components/toast';

export function mapResponse<T> (response: HttpResponse<T, HttpExceptionSchema>, notifyOnFail = true): Result<T> {
    const { data, error } = response;

    if (error) {
        if (notifyOnFail) {
            notify({
                title: error.error,
                content: error.message,
                browserId: 'error',
                error: true,
            });
        }

        return {
            code: error.statusCode,
            error: new Error(error.message),
        };
    }

    return {
        data,
    };
}

export class ApiProvider<State> extends Notifier<State> {
    protected readonly client: Api<never>;

    constructor (state: State) {
        super(state);
        this.client = new Api();
    }

    async apiAction <T> (action: (client: Api<never>) => Promise<HttpResponse<T, HttpExceptionSchema>>) {
        const response = await action(this.client);

        return mapResponse(response);
    }
}

export class ApiEventProvider<State, Event extends Record<string, any>> extends EventNotifier<State, Event> {
    protected readonly client: Api<never>;

    constructor (state: State) {
        super(state);
        this.client = new Api();
    }

    async apiAction <T> (action: (client: Api<never>) => Promise<HttpResponse<T, HttpExceptionSchema>>) {
        const response = await action(this.client);

        return mapResponse(response);
    }
}
