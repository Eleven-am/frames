import { TaskEither } from '@eleven-am/fp';

interface IdKey {
    id: string;
}

type DedupeCacheProcessor<T extends IdKey> = (data: T[]) => TaskEither<unknown>;

interface Options<T extends IdKey> {
    timeout?: number;
    processor: DedupeCacheProcessor<T>;
}

export class DedupeCache<T extends IdKey> {
    private readonly cache: Map<string, T> = new Map();

    private timer: NodeJS.Timeout | null = null;

    private readonly timeout: number;

    private readonly processor: DedupeCacheProcessor<T>;

    constructor (options: Options<T>) {
        this.processor = options.processor;
        this.timeout = options.timeout ?? 1000;
    }

    public add (data: T) {
        this.cache.set(data.id, data);
        this.resetTimer();
    }

    private resetTimer () {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => this.processAndClear(), this.timeout);
    }

    private processAndClear () {
        this.timer = null;
        if (this.cache.size === 0) {
            return;
        }

        const data = Array.from(this.cache.values());

        this.cache.clear();

        return this.processor(data).toPromise();
    }
}
