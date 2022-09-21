import {MediaType} from "@prisma/client";
import rename from "locutus/php/strings/strtr";
import fetch from "cross-fetch";

export const dicDo = {
    "mp4": "", "m4v": "", "264": "",
    "1080p": "", "bluray": "", "x264": "",
    "h264": "", "hddvd": "", "brrip": "",
    "bitloks": "", "extended": "", "webrip": "",
    "theatrical": "", "edition": "", "4k": "", "x265": "",
    "10bit": "", "rarbg": "", "anoxmous": "", "10-bit": "",
    "Deceit": "", "imax": "", "unrated": "",
    "aac2": "", "0pr1nce": "", "yify": "", "aac": "", "yts": "",
    "directors cut": "",
};

type sortType = 'asc' | 'desc';

type AddProperty<T, K extends string, A> = T & { [P in K]: A };

type ExtractPropertyNames<T, M> = {
    [K in keyof T]: T[K] extends M ? K : never
}[keyof T]

type ExtractSameValueType<A, B, C extends keyof A> = {
    [K in keyof B]: B[K] extends A[C] ? A[C] extends B[K] ? K : never : never
}[keyof B]

export class BaseClass {

    /**
     * @desc attempts to normalize an array
     * @param arr - the array to normalize
     * @param key - the key to normalize
     */
    public normalise<S>(arr: S[], key: ExtractPropertyNames<S, number>): S[] {
        if (arr.length === 0) return [];
        const temp = this.sortArray(arr, key, 'asc');
        const min: any = temp[0][key];
        const max: any = temp[temp.length - 1][key];
        const range = max - min as number;

        return arr.map(item => {
            const value = item[key] as any as number;
            return {
                ...item,
                [key]: (value - min) / range
            }
        })
    }

    /**
     * @desc builds an interface from an object
     * @param obj - the object to build the interface from
     * @param interfaceName - the name of the interface
     * @param ground - the level of the recursion
     */
    public objectToInterface(obj: any, interfaceName: string, ground = 0): string {
        let str = ground === 0 ? `export interface ${interfaceName} {\n` : `{\n`;
        const tab = Array(ground).fill('\t').join('') + '\t';
        for (let key in obj) {
            switch (true) {
                case obj[key] === null:
                    str += `${tab}${key}: null;\n`;
                    break;

                case Array.isArray(obj[key]):
                    str += `${tab}${key}: Array<${typeof obj[key][0] === 'object' || Array.isArray(obj[key][0]) ? this.objectToInterface(obj[key][0], key, ground + 1).replace(/\n$/, '') : typeof obj[key][0]}>;\n`;
                    break;

                case typeof obj[key] === 'object':
                    str += `${tab}${key}: ${this.objectToInterface(obj[key], key, ground + 1).replace(/\n$/, '')};\n`;
                    break;

                case typeof obj[key] === 'string':
                    const isDate = !isNaN(Date.parse(obj[key]));
                    const isBoolean = obj[key] === 'true' || obj[key] === 'false';
                    str += `${tab}${key}: ${isDate ? 'Date' : isBoolean ? 'boolean' : 'string'};\n`;
                    break;

                case typeof obj[key] === 'number':
                    str += `${tab}${key}: number;\n`;
                    break;

                case typeof obj[key] === 'boolean':
                    str += `${tab}${key}: boolean;\n`;
                    break;

                case typeof obj[key] === 'function':
                    str += `${tab}${key}: () => void;\n`;
                    break;
            }
        }

        str += `${tab.replace(/\t/, '')}}\n`;
        return str;
    }

    /**
     * @desc returns a key from a weighted random object
     * @param spec - the spec to use
     */
    public weightedRandom<B extends keyof A, A extends { [p: string]: number }>(spec: A): B | 'none' {
        let i = 0, sum = 0, r = Math.random();
        for (const key in spec) {
            sum += spec[key];
            if (r <= sum) return key as any as B;
            i++;
        }

        return 'none';
    }

    /**
     * @desc counts the amount of times an element occurs in an array of arrays
     * @param arrayOfA - the array of arrays
     * @param key - the key to save the count in
     * @param needle - the element property to count
     */
    public countAppearances<A extends { count?: number, [p: string]: any }, C extends keyof A, B extends string>(arrayOfA: A[][], key: B, needle: C): AddProperty<Omit<A, 'count'>, B, number>[] {
        let count = 0;
        let response: AddProperty<A, B, number>[] = [];
        const map = new Map<string | number, A & { count: number }>();

        while (count < arrayOfA.length) {
            const items = arrayOfA[count];

            items.forEach(item => {
                const val = map.get(item[needle]) as A & { count: number };
                if (val)
                    val.count++;
                else {
                    const count = item.count ? item.count + 1 : 1;
                    map.set(item[needle], {...item, count});
                }
            });

            count++;
        }

        map.forEach((value, _) => {
            const val = value as any;
            const count = val.count;
            delete val.count;
            response.push({...val, [key]: count});
        })

        return response;
    }

    /**
     * @desc sorts an array of objects in ascending or descending order based on the provided object keys
     * @param array - the array to sort
     * @param arrayKeys - the keys to sort by
     * @param orders - the order to sort by
     */
    public sortArray<S, T extends keyof S>(array: S[], arrayKeys: T[] | T, orders: sortType[] | sortType): S[] {
        let keys = Array.isArray(arrayKeys) ? arrayKeys : [arrayKeys];
        let ordersArray = Array.isArray(orders) ? orders : [orders];
        return array.sort((a, b) => {
            let i = 0;
            while (i < keys.length) {
                if (ordersArray[i] === 'asc') {
                    if (a[keys[i]] < b[keys[i]]) return -1;
                    if (a[keys[i]] > b[keys[i]]) return 1;
                } else {
                    if (a[keys[i]] < b[keys[i]]) return 1;
                    if (a[keys[i]] > b[keys[i]]) return -1;
                }
                i++;
            }
            return 0;
        });
    }

    /**
     * @desc creates an uuid v4 string
     */
    public createUUID() {
        let dt = new Date().getTime();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    /**
     * @desc returns a grouped array of objects
     * @param array - the array to group
     * @param key - the key to group by
     * @param sortType - the type of sorting to use (asc or desc)
     */
    public groupBy<T extends { [p: string]: any }, K extends keyof T>(array: T[], key: K, sortType?: sortType) {
        const map = new Map<T[K], T[]>();
        sortType = sortType ? sortType : 'asc';

        array.forEach(item => {
            const val = map.get(item[key]);
            if (val)
                val.push(item);
            else
                map.set(item[key], [item]);
        });

        const result: {key: T[K], value: T[], length: number}[] = [];
        map.forEach((value, key) => {
            result.push({key, value, length: value.length});
        });

        return this.sortArray(result, 'length', sortType);
    }

    /**
     * @desc makes a segment from a string
     * @param size - the size of the segment
     */
    public makeId(size: number): string {
        let text = "";
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (let i = 0; i < size; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    /**
     * @desc makes a key from multiple segments of strings
     * @param length - the length of each segment
     * @param segments - the amount of segments
     * @protected
     */
    public generateKey(length: number, segments: number) {
        length = length || 4;
        segments = segments || 4;
        let int = 0;
        let response = '';

        while (int < segments - 1) {
            response += this.makeId(length) + '-';
            int++;
        }

        response += this.makeId(length);
        return response;
    }

    /**
     * @desc converts strung to time if possible
     * @param t - string to convert
     */
    public parseTime(t: string) {
        const segments = t.split(':');
        const ms = parseInt(segments[2].split(',')[1]);
        const h = parseInt(segments[0]);
        const m = parseInt(segments[1]);
        const s = parseInt(segments[2]);
        return h * 60 * 60 * 1000 + m * 60 * 1000 + s * 1000 + ms;
    }

    /**
     * @desc compares two dates
     * @param a - the first date
     * @param b - the second date
     */
    public compareDates(a: Date, b: Date = new Date()) {
        const info = Math.abs(a.getTime() - b.getTime());
        const seconds = 1000;
        const minutes = seconds * 60;
        const hours = minutes * 60;
        const days = hours * 24;
        const week = days * 7;
        const months = days * 30;
        const years = days * 365;
        const date = new Date(a.getTime() - b.getTime());

        if (info > years - 1) {
            const yy = Math.floor(info / years);
            return yy + ' year' + (yy > 1 ? 's' : '') + ' ago';
        } else if (info > months - 1) {
            const mm = Math.floor(info / months);
            return mm + ' month' + (mm > 1 ? 's' : '') + ' ago';
        } else if (info > week - 1) {
            const ww = Math.floor(info / week);
            return ww + ' week' + (ww > 1 ? 's' : '') + ' ago';
        } else if (info > days - 1) {
            const dd = Math.floor(info / days);
            const minute = date.getMinutes();
            const hour = date.getHours();
            const twelveHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            const ampm = hour > 12 ? 'PM' : 'AM';
            const day = date.getDay();
            if (dd < 2)
                return 'Yesterday at ' + twelveHour + ':' + (minute > 9 ? '' : '0') + minute + ' ' + ampm;

            else {
                const dayInWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return 'Last ' + dayInWeek[day] + ' at ' + twelveHour + ':' + (minute > 9 ? '' : '0') + minute + ' ' + ampm;
            }
        } else if (info > hours - 1) {
            const hh = Math.floor(info / hours);
            return (hh > 1 ? hh : 'An') + ' hour' + (hh > 1 ? 's' : '') + ' ago';
        } else if (info > minutes - 1) {
            const mm = Math.floor(info / minutes);
            return (mm > 1 ? mm : 'A') + ' minute' + (mm > 1 ? 's' : '') + ' ago';
        } else if (info > seconds - 1)
            return 'A few seconds ago';

        else
            return 'Just now';
    }

    /**
     * @desc converts an int to a valid bytes
     * @param bytes - int to convert
     * @param decimals - number of decimals
     */
    public formatBytes(bytes: number, decimals = 2): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * @desc converts a String to a valid bytes value
     * @param string - string to be converted
     */
    public toBytes(string: string): number {
        let index = -1;
        let k = 0;
        string = string.replace(/ /g, '')
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        for (let i = 0; i < sizes.length; i++) if (string.includes(sizes[i])) index = i;

        let bytes = Math.floor(parseFloat(string.replace(sizes[index], '')))
        while (k < index) {
            bytes *= 1024
            k++
        }

        return Math.floor(bytes)
    }

    /**
     * @desc gets a random set of element from an array
     * @param arr - array to get random elements from
     * @param length - the amount of elements to get
     * @param id - the id of the element to be excluded
     * @param type - the type of the element to be accepted
     */
    public shuffle<S extends { id: number, type?: MediaType }>(arr: S[], length: number, id: number, type?: MediaType) {
        let array: S[] = [];
        let temp = type ? arr.filter(item => item.id !== id && item.type === type) : arr.filter(item => item.id !== id);

        length = length > temp.length ? temp.length : length;

        while (array.length < length) {
            const index = Math.floor(Math.random() * temp.length);
            array.push(temp[index]);
            temp.splice(index, 1);
        }

        return array;
    }

    /**
     * @desc returns an array of objects without any duplicates comparing the property of the object needle
     * @param arr - array to remove duplicates from
     * @param needle - the property or set of properties to compare
     */
    public uniqueId<T, K extends keyof T>(arr: T[], needle: K | K[]): T[] {
        let a = arr.concat();
        const keys = Array.isArray(needle) ? needle : [needle];
        for (let i = 0; i < a.length; ++i)
            for (let j = i + 1; j < a.length; ++j) {
                const same = keys.every(key => a[i][key] === a[j][key]);
                if (same)
                    a.splice(j--, 1);
            }

        return a;
    }

    /**
     * @desc returns a string with the first letter capitalized
     * @param str - string to capitalize
     */
    public capitalize(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * @desc decodes a string using it's secret key
     * @param salt - the secret key
     * @param encoded - the encoded string
     */
    public decrypt<S>(salt: string, encoded: string) {
        const textToChars = (text: string) => text.split("").map((c) => c.charCodeAt(0));
        const applySaltToChar = (code: any) => textToChars(salt).reduce((a, b) => a ^ b, code);
        try {
            const response = JSON.parse((atob(encoded).toString().match(/.{1,2}/g) || [])
                .map((hex) => parseInt(hex, 16))
                .map(applySaltToChar)
                .map((charCode) => String.fromCharCode(charCode))
                .join(""))

            return response === 'null' ? null : response as S;
        } catch (e) {
            return null;
        }
    }

    /**
     * @desc encodes an object using into a string using it's secret key
     * @param salt - the secret key
     * @param text - the object to encode
     */
    public encrypt(salt: string, text: any) {
        const textToChars = (text: string) => text.split("").map((c) => c.charCodeAt(0));
        const byteHex = (n: number) => ("0" + Number(n).toString(16)).substr(-2);
        const applySaltToChar = (code: any) => textToChars(salt).reduce((a, b) => a ^ b, code);

        const token = JSON.stringify(text)
            .split("")
            .map(textToChars)
            .map(applySaltToChar)
            .map(byteHex)
            .join("");

        return btoa(token).toString();
    }

    /**
     * @desc returns array excluding the elements of the second array
     * @param arr - array to check
     * @param arr2 - array to check against
     * @param keyA - the key to compare
     * @param keyB - the key to compare
     */
    public exclude<A, B, C extends keyof A, D extends keyof B>(arr: A[], arr2: B[], keyA: C | C[], keyB: D | D[]): Array<A> {
        let a: any = arr.concat();
        let b = arr2.concat();
        const results: A[] = [];
        let keysA = Array.isArray(keyA) ? keyA : [keyA];
        let keysB = Array.isArray(keyB) ? keyB : [keyB];

        for (let i = 0; i < a.length; ++i) {
            const notFound = b.every(item => !keysA.every((key, index) => a[i][key] === item[keysB[index]]));

            if (notFound)
                results.push(a[i]);
        }

        return results;
    }

    /**
     * @desc returns the intersects of two arrays keeping an object key from the second array in the first
     * @param arr - array to check
     * @param arr2 - array to check against
     * @param keyA - the key to compare
     * @param keyB - the key to compare
     * @param keepKeys - the key to save
     */
    public intersect<A, B, C extends keyof A, D extends ExtractSameValueType<A, B, C>, E extends keyof B>(arr: A[], arr2: B[], keyA: C | C[], keyB: D | D[], keepKeys?: E | E[]): Array<A & Pick<B, E>> {
        let a: any[] = arr.concat();
        let b: any[] = arr2.concat();
        let c: (A & Pick<B, E>)[] = [];
        let keysA = Array.isArray(keyA) ? keyA : [keyA];
        let keysB = Array.isArray(keyB) ? keyB : [keyB];
        let keptKeys = Array.isArray(keepKeys) ? keepKeys : [keepKeys];

        for (let i = 0; i < a.length; ++i) {
            const item = b.find(item => keysA.every((key, index) => a[i][key] === item[keysB[index]]));
            if (item) {
                if (keptKeys.length > 0) {
                    let obj = {...a[i]};
                    keptKeys.forEach(key => obj[key] = item[key]);
                    c.push(obj);

                } else
                    c.push(a[i]);
            }
        }

        return c;
    }

    /**
     * @desc Calculates the similarity between two strings by using the Levenshtein distance
     * @param str1 - the first string
     * @param str2 - the second string
     */
    public levenshtein(str1: string, str2: string) {
        let a = str1.toLowerCase();
        let b = str2.toLowerCase() + "", m = [], i, j, min = Math.min;

        if (!(a && b)) return (b || a).length;

        for (i = 0; i <= b.length; m[i] = [i++]) ;
        for (j = 0; j <= a.length; m[0][j] = j++) ;

        for (i = 1; i <= b.length; i++)
            for (j = 1; j <= a.length; j++)
                m[i][j] = b.charAt(i - 1) === a.charAt(j - 1) ? m[i - 1][j - 1] : m[i][j] = min(m[i - 1][j - 1] + 1, min(m[i][j - 1] + 1, m[i - 1][j] + 1))

        return m[b.length][a.length];
    }

    /**
     * @dwc makes a HTTP request
     * @param url - url to request
     * @param params - params to send
     * @param method - method to use
     * @param source - axios cancel token
     */
    public async makeRequest<S>(url: string, params: any, method: 'POST' | 'GET' = 'GET', source?: AbortSignal): Promise<S | null> {
        return new Promise<S | null>(resolve => {
            url = params && method === 'GET' ? url + '?' + new URLSearchParams(params).toString() : url;
            fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: method === 'POST' ? JSON.stringify(params) : null,
                signal: source || null
            }).then(async response => {
                if (response.status >= 200 && response.status < 300) {
                    try {
                        const res = await response.json();
                        resolve(res);
                    } catch (e) {
                        const res = await response.text() as any as S
                        resolve(res);
                    }
                } else {
                    resolve(null);
                }
            }).catch(() => {
                resolve(null);
            });
        })
    }

    /**
     * @desc fixes a file name to be valid
     * @param str - the file name
     * @private
     */
    protected prepareString(str: string) {
        str = str.replace(/NaN/g, '');
        str = str.replace(/\d{3,4}p.*?$/gi, ' ');
        str = str.replace(/\(.*?\)|\[.*?]/g, ' ');
        str = str.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9]/g, ' ').toLowerCase();
        str = str.replace(/\s+/g, ' ');
        str = rename(str, dicDo);
        str = str.trim();
        return str;
    }
}
