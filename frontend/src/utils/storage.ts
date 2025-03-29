export interface IStorage<Data> {
    set: (data: Data) => void;
    remove: () => void;
    get: () => Data;
}

export function storage<Data> (key: string, defaultValue: Data): IStorage<Data> {
    function set (data: Data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function get () {
        if (typeof window === 'undefined') {
            return defaultValue;
        }

        const item = localStorage.getItem(key);

        if (item === null) {
            set(defaultValue);

            return defaultValue;
        }

        return JSON.parse(item) as Data;
    }

    function remove () {
        localStorage.removeItem(key);
    }

    return {
        set,
        get,
        remove,
    };
}
