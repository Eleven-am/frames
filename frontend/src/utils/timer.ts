export class Timer {
    #timeout: NodeJS.Timeout | null;

    constructor () {
        this.#timeout = null;
    }

    start (callback: () => void, delay: number) {
        this.clear();
        this.#timeout = setTimeout(callback, delay);
    }

    clear () {
        if (this.#timeout) {
            clearTimeout(this.#timeout);
            this.#timeout = null;
        }
    }
}
