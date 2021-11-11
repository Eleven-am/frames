import axios from 'axios';
import {MediaType} from '@prisma/client';

declare global {
    interface Array<T> {
        /**
         * @desc returns all duplicates in ar array of objects using the property of the object needle
         * @param needle
         */
        uniqueID<K extends keyof T>(needle: K): Array<T>;

        /**
         * @desc helps to filter an array by another array
         * @param array home array
         * @param key1
         * @param homeKey
         */
        filterInFilter<S, A extends keyof T, B extends keyof S>(array: Array<S>, key1: A, homeKey: B): Array<S>;

        /**
         * @desc sorts an array of objects based on a property of the objects
         * @param key
         * @param asc
         */
        sortKey<K extends keyof T>(key: K, asc: boolean): Array<T>;

        /**
         * @desc sorts an array based on 2 keys in the array and the 2 rules, 1 for each key
         * @param key1
         * @param key2
         * @param asc1
         * @param asc2
         */
        sortKeys<A extends keyof T, B extends keyof T>(key1: A, key2: B, asc1: boolean, asc2: boolean): Array<T>

        /**
         * @desc helps searches the database for an array entries returned from TMDB, returning a smaller array of objects that do exist
         * @param array2 the host database
         * @param type to be accepted
         */
        collapse<S>(array2: Array<S>, type: MediaType): Array<S>;

        /**
         * @desc helps searches the database for an array entries returned from TMDB, returning a smaller array of objects that do exist
         * @param array2 the host database
         * @param type to be accepted
         * @param keepKey useful for saving specific keys || optional
         */
        collapse<S, B extends keyof T>(array2: Array<S>, type: MediaType, keepKey: B): Array<S & Pick<T, B>>;

        /**
         * @param length length of new array
         * @param id to be rejected
         * @param type to be rejected
         * @returns an int length array with random items from database: excluding the values listed
         */
        randomiseDB(length: number, id: number, type?: MediaType): Array<T>;
    }

    interface String {
        /**
         * @desc helps compare the similarities between two strings
         * @param string
         */
        Levenshtein(string: string): number;

        /**
         * @desc helps compare the similarities between two strings
         * @param string
         * @param val
         */
        Levenshtein(string: string, val: number): boolean;

        /**
         * @desc returns in percent the amount of words the original shares with the new string
         * @param string
         * @param whole
         */
        strip(string: string, whole?: boolean): boolean;
    }
}

/**
 * @desc generates keys based on configuration (UUID FORMAT)
 * @returns {string}
 */
const create_UUID = (): string => {
    let dt = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

/**
 * @desc takes an array and splits it in to 2 using the int as a guide
 * @param array
 * @param int
 * @returns {{result: *, left: *}}
 */
const takeFive = <S>(array: S[], int: number): {result: S[], left: S[]} => {
    if (Array.isArray(array)){
        int = int >= array.length ? array.length : int;
        let res = array.slice(0, int);
        array = array.slice(int, int + array.length)
        return {result: res, left: array};
    } else
        return {result: [], left: []};
}

/**
 * @desc generates keys based on configuration (key = x^n || x = a character n = length)
 * @param length
 * @param characters
 * @returns {string}
 */
const makeId = (length: number, characters?: string): string => {
    let result = '';
    characters = characters || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

/**
 * @desc generates keys based on configuration (key = x^n-x^n... eg aw2W-iPo1-zQeP || segment = 4, length = 3)
 * @param length
 * @param segments
 * @returns {string}
 */
const generateKey = (length: number, segments: number): string => {
    length = length || 4;
    segments = segments || 4;
    let int = 0;
    let response = '';

    while (int < length - 1) {
        response += makeId(segments) + '-';
        int++;
    }

    response += makeId(segments);
    return response;
}

/**
 * @desc ajax function wrapped in a promise
 * @param url
 * @returns the header on fail or on demand otherwise returns a json file
 */
const get = async<S>(url: string): Promise<false | S> => {
    return await axios.get(url)
        .then(response => {
            return response.data;
        }).catch(() => {
            return false;
        });
}

/**
 * @desc ajax function wrapped in a promise
 * @param obj
 * @param data
 * @returns the header on fail or on demand otherwise returns a json file
 */
const aJax = async (obj: any, data: any): Promise<boolean| any> => {
    return new Promise((resolve, reject) => {
        axios({...obj, data: {...data}})
            .then(response => {
                resolve(response.data);
            }).catch(reason => {
            reject(reason);
        });
    })
}

/**
 * @desc converts strung to time if possible
 * @param t
 */
const parseTime = (t: string) => {
    const segments = t.split(':');
    const ms = parseInt(segments[2].split(',')[1]);
    const h = parseInt(segments[0]);
    const m = parseInt(segments[1]);
    const s = parseInt(segments[2]);
    return h * 60 * 60 * 1000 + m * 60 * 1000 + s * 1000 + ms;
}

Array.prototype.collapse = function (array2: any[], type: MediaType, keepKey?: string): any[] {
    let array = [];
    for (let i = 0; i < this.length; i += 1) {
        let res = array2.find(item => item.tmdbId === this[i].id && item.type === type);
        if (res !== undefined) {
            if (keepKey) {
                let keys = keepKey.split(' ');
                for (let item of keys)
                    res[item] = this[i][item];
            }
            array.push(res);
        }
    }

    return array;
}

Array.prototype.uniqueID = function<T, K extends keyof T>(needle: K): T[] {
    let a = this.concat();
    for (let i = 0; i < a.length; ++i) {
        for (let j = i + 1; j < a.length; ++j) {
            if (a[i][needle] === a[j][needle])
                a.splice(j--, 1);
        }
    }

    return a;
}

Array.prototype.randomiseDB = function (length, id, type) {
    let array: any[] = [];
    let temp = this.filter(item => item.id !== id && item.type === type);
        
    length = length > temp.length ? temp.length : length;
    for (let i = 0; i < length; i++) {
        let int = Math.floor(Math.random() * temp.length);
        while (array.some(file => file.id === temp[int].id))
            int = Math.floor(Math.random() * temp.length);

        array.push(temp[int]);
    }
    return array;
}

Array.prototype.filterInFilter = function(array, key1, homeKey) {
    const newArray = [];
    for (let item of array) {
        // @ts-ignore
        const temp = this.find(e => e[key1] === item[homeKey]);
        if (temp === undefined)
            newArray.push(item);
    }

    return newArray;
}

Array.prototype.sortKey = function (key, asc): any[] {
    return this.sort(function (a, b) {
        let x = a[key];
        let y = b[key];
        return asc ? ((x < y) ? -1 : ((x > y) ? 1 : 0)) : ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
}

Array.prototype.sortKeys = function (key1, key2, asc1, asc2): any[] {
    return this.sort(function (a, b) {
        let a1 = a[key1];
        let a2 = a[key2];
        let b1 = b[key1];
        let b2 = b[key2];

        if (a1 === b1)
            return asc2 ? ((a2 < b2) ? -1 : ((a2 > b2) ? 1 : 0)) : ((a2 > b2) ? -1 : ((a2 < b2) ? 1 : 0));

        else
            return asc1 ? ((a1 < b1) ? -1 : ((a1 > b1) ? 1 : 0)) : ((a1 > b1) ? -1 : ((a1 < b1) ? 1 : 0));
    });
}

String.prototype.Levenshtein = function (string: string, val?: number): any {
    let a = this, b = string + "", m = [], i, j, min = Math.min;

    if (!(a && b)) return (b || a).length;

    for (i = 0; i <= b.length; m[i] = [i++]) ;
    for (j = 0; j <= a.length; m[0][j] = j++) ;

    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            m[i][j] = b.charAt(i - 1).toLowerCase() === a.charAt(j - 1).toLowerCase()
                ? m[i - 1][j - 1]
                : m[i][j] = min(
                    m[i - 1][j - 1] + 1,
                    min(m[i][j - 1] + 1, m[i - 1][j] + 1))
        }
    }

    return val ? m[b.length][a.length] < val: m[b.length][a.length];
}

String.prototype.strip = function (string: string, whole?: boolean): boolean {
    let count = 0;
    let index = -1;
    let first = this.split(' ').filter(item => item !== '');
    let second = string.split(' ');
    let length = whole ? first.length < second.length ? first.length : second.length :first.length > second.length ? first.length : second.length;

    for (let i = 0; i < first.length; i++)
        for (let j = index +1; j < second.length; j++) {
            if (first[i].replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase() === second[j].replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase()) {
                index = j;
                count++
                break;
            }
        }

    return (count/length) * 100 > 70;
}

/**
 * @desc converts an int to a valid bytes
 * @param bytes
 * @param decimals
 * @returns {string}
 */
const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * @desc converts a String to a valid bytes value
 * @param string
 * @returns {int}
 */
const toBytes = (string: string): number => {
    let index = -1;
    let k = 0;
    string = string.replace(/ /g, '')
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    for (let i = 0; i < sizes.length; i++)
        if (string.includes(sizes[i]))
            index = i;

    let bytes = Math.floor(parseFloat(string.replace(sizes[index], '')))
    while (k < index) {
        bytes *= 1024
        k++
    }

    return Math.floor(bytes)
}

export {
    parseTime,
    create_UUID,
    generateKey,
    takeFive,
    get,
    toBytes,
    formatBytes,
    aJax
};