import axios from 'axios';
import {MediaType} from '@prisma/client';
import {createCanvas, loadImage} from "canvas";
import path from "path";

declare global {
    interface Array<T> {
        /**
         * @desc returns all duplicates in ar array of objects using the property of the object needle
         * @param needle
         */
        uniqueID(needle: string): Array<T>;

        /**
         * @desc helps to filter an array by another array
         * @param array home array
         * @param key1
         * @param homeKey
         */
        filterInFilter<S>(array: Array<S>, key1: string, homeKey: string): Array<S>;

        /**
         * @desc sorts an array of objects based on a property of the objects
         * @param key
         * @param asc
         */
        sortKey(key: string, asc: boolean): Array<T>;

        /**
         * @desc sorts an array based on 2 keys in the array and the 2 rules, 1 for each key
         * @param key1
         * @param key2
         * @param asc1
         * @param asc2
         */
        sortKeys(key1: string, key2: string, asc1: boolean, asc2: boolean): Array<T>

        /**
         * @desc helps searches the database for an array entries returned from TMDB, returning a smaller array of objects that do exist
         * @param array2 the host database
         * @param type to be accepted
         * @param keepKey useful for saving specific keys || optional
         */
        collapse<S>(array2: Array<S>, type: MediaType, keepKey?: string): Array<S>;

        /**
         * @param length length of new array
         * @param id to be rejected
         * @param type to be rejected
         * @returns an int length array with random items from database: excluding the values listed
         */
        randomiseDB(length: number, id: number, type?: MediaType): Array<T>;

        /**
         * @desc takes a second array and adds it to the first array increasing the resulting rep in the process
         * @param array2
         * @param rep
         * @constructor
         */
        expand(array2: any[], rep: number): Array<T>;
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
const get = async (url: string): Promise<false | any> => {
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
        axios(obj, data)
            .then(response => {
                resolve(response.data);
            }).catch(reason => {
            reject(reason);
        });
    })
}

const parseTime = (t: string) => {
    const segments = t.split(':');
    const ms = parseInt(segments[2].split(',')[1]);
    const h = parseInt(segments[0]);
    const m = parseInt(segments[1]);
    const s = parseInt(segments[2]);
    return h * 60 * 60 * 1000 + m * 60 * 1000 + s * 1000 + ms;
}

function aspectRatio(width: number, height: number, url: string) {
    const ext = path.extname(url)

    let a = width;
    let b = height;
    while (a != b) {
        if (a > b) a -= b; else b -= a;
    }

    return (width / a === 16) && (height / a === 9) && ext !== '.png';
}

async function getImage(externalUrl: string): Promise<string> {
    return new Promise<string>(resolve => {
        loadImage(externalUrl).then(image => {
            const width = image.naturalWidth;
            const height = image.naturalHeight;
            if (aspectRatio(width, height, externalUrl))
                resolve('rgba(1, 16, 28, .5)');

            else {
                const canvas = createCanvas(width, height)
                const ctx = canvas.getContext('2d')
                ctx.drawImage(image, 0, 0);
                let imageData = ctx.getImageData(0, 0, width, height);
                let data = imageData.data;
                let r = 0;
                let g = 0;
                let b = 0;

                for (let i = 0; i < data.length; i += 4) {
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                }

                r = Math.floor(r / (data.length / 4));
                g = Math.floor(g / (data.length / 4));
                b = Math.floor(b / (data.length / 4));

                r = r > 192 ? r - 192 : r;
                g = g > 192 ? g - 192 : g;
                b = b > 192 ? b - 192 : b;

                resolve('rgba(' + r + ', ' + g + ', ' + b + ', .5)');
            }
        }).catch(e => {
            console.log(e);
            resolve('rgba(0, 0, 0, .5)');
        })
    })
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

Array.prototype.uniqueID = function (needle: string): any[] {
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

Array.prototype.filterInFilter = function<S>(array: S[], key1: string, homeKey: string) {
    const newArray: Array<S> = [];
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

Array.prototype.expand = function (array2: any[], rep: number): any[] {
    array2 = array2.map(item => {
        return {
            name: item.title === undefined ? item.name : item.title,
            id: item.id,
            tmdbId: item.id,
            rep,
            poster: 'https://image.tmdb.org/t/p/original' + item.backdrop_path,
            type: item.title === undefined ? 0 : 1,
        };
    });
    let array = [];
    if (this.length) {
        for (let i = this.length - 1; i >= 0; i -= 1) {
            let res = array2.find(item => item.tmdbId === this[i].tmdbId && item.type === this[i].type);
            if (res !== undefined)
                this[i].rep = res.rep > this[i].rep ? res.rep + 1 : this[i].rep + 1;
            array.push(this[i]);
        }
    }

    return array.concat(array2).sortKey('rep', false).uniqueID('tmdbId');
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

let logger: boolean = false;

/**
 * setter
 * @param value
 */
const change = (value: boolean) => {
    logger = value;
}

/**
 * getter
 * @returns {boolean}
 */
const getLogger = (): boolean => logger;

/**
 * custom console log function
 * @param line
 * @param file
 * @param info
 */
const frameLog = (line: number, file: string, info: any) => {
    if (logger)
        console.log(line, file, info)
}

export {
    getImage,
    parseTime,
    create_UUID,
    generateKey,
    frameLog,
    takeFive,
    change,
    get,
    toBytes,
    formatBytes,
    getLogger,
    aJax
};