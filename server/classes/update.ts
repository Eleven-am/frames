import {Episode, Media as Med, MediaType, Video} from '@prisma/client';
import {drive, prisma} from "../base/utils";
import env from "../base/env";
import rename from 'locutus/php/strings/strtr';
import {
    FrontImage,
    FrontSearch,
    getAllImages,
    getAppleImages,
    getDetails,
    getExternalId,
    getFramesImage,
    performSearch,
    search,
} from "../base/tmdb_hook";
import Media from "./media";
import {drive_v3} from "googleapis";
import path from 'path';

const environment = env.config;
const {movies, tvShows} = environment.library;
const OS = require('opensubtitles-api');

export interface UpdateInterface {
    name: string,
    type: MediaType,
    tmdbId: number,
    poster: string,
    logo: string,
    backdrop: string
}

export interface UpdateImages {
    backdrop: string,
    poster: string,
    logo: string,
    name: string

    [p: string]: string;
}

export interface FrontTmDB {
    movies: FrontBit[],
    shows: FrontBit[]
}

export interface FrontBit {
    available: boolean;
    name?: string;
    file: drive_v3.Schema$File,
    res: { tmdbId: number, name: string, drift: number, popularity: number, backdrop: string | null, year: number }[]
    type: MediaType;
}

export interface AppleIMages {
    title: string;
    type: string;
    releaseDate: string;
    images: {
        coverArt16X9: string;
        fullColorContentLogo?: string;
        singleColorContentLogo: string;
        previewFrame: string;
    }
}

export interface UpdateSearch {
    name: string;
    backdrop: string;
    logo: string;
    poster: string;
    type: MediaType;
    id: number;
    overview: string;
}

export interface UpdateMediaSearch extends Omit<FrontSearch, 'type' | 'present'> {
    date: string;
    type: MediaType;
}

export interface FramesImages {
    logos: FrontImage[],
    backdrops: FrontImage[],
    posters: FrontImage[]
}

const mediaClass = new Media();

const dicDo = {
    " (1080p HD).m4v": "", " (HD).m4v": "", " (4K).m4v": "",
    "_": "", ".mp4": "", ".m4v": "", "-": " ", "264": "",
    "1080p": "", "BluRay": "", "YIFY": "", "x264": "", "HDDVD": "",
    "BrRip": "", "[": "", "]": "", "AG": "", "AM": "",
    "YTS": "", "AAC5.1": "", "MX": "", "LT": "", "2011": "",
    "ECE": "", "bitloks": "", "Extended": "", "Bluray": "", "WEB": "",
    "+HI": "", "WEBRip": "", "BRrip": "", "GAZ": "", "720p": "",
    "1968": "", "AAC": "", "ExD": "", "THEATRICAL": "", "EDITION": "",
    "(": "", ")": "", "2160p": "", "4K": "", "x265": "", "10bit": "",
    "EXTENDED": "", "RARBG": "", "anoXmous": "", "10-bit": "",
    "Deceit": "", "BOKUTOX": "", " ( FIRST TRY)": "", "IMAX": "",
    "UNRATED": "", "BrRIp": "", "AAC2": "", "0PRiNCE": "", "Brrip": "",
    ".": " ", "Directors Cut": "", "DIRECTORS.CUT": "",
};

export class Subtitles {
    private readonly OpenSubtitles;

    constructor() {
        if (environment.openSubtitles) {
            const {useragent, password, username} = environment.openSubtitles;
            this.OpenSubtitles = new OS({useragent, username, password, ssl: true});
        } else this.OpenSubtitles = null;
    }

    /**
     * @desc this is a recursive function that handles the subtitles logic
     * @returns {Promise<void>}
     */
    async getSubs() {
        if (this.OpenSubtitles) {
            const subs = await prisma.sub.findMany();

            while (subs.length) {
                await this.getSub(subs[0].videoId);
                await new Promise<void>(resolve => {
                    setTimeout(() => {
                        subs.shift();
                        resolve();
                    }, 3000)
                })
            }

            await prisma.sub.deleteMany();
        }
    }

    /**
     * @desc does the actual scan for the subtitles of a specific video file
     * @param videoId
     * @param auth
     */
    async getSub(videoId: number, auth?: string) {
        let returnSubs: { language: string, url: string }[] = [];
        if (this.OpenSubtitles) {
            const video = await prisma.video.findFirst({where: {id: videoId}, include: {media: true, episode: true}});
            if (video) {
                const file = await drive.getFile(video.location);
                if (file) {
                    let obj: any = null;
                    if (video.episode) {
                        const external = await getExternalId(video.media.tmdbId, MediaType.SHOW);
                        if (external) {
                            obj = {
                                season: video.episode.seasonId,
                                filesize: file.size,
                                filename: file.name,
                                episode: video.episode.episode,
                                imdbid: external.imdb_id
                            };
                        }
                    } else {
                        const external = await getExternalId(video.media.tmdbId, MediaType.MOVIE);
                        if (external)
                            obj = {filesize: file.size, filename: file.name, imdbid: external.imdb_id};
                    }

                    if (obj) {
                        obj.extensions = ['srt', 'vtt'];
                        let keys = ['en', 'fr', 'de'];
                        let lang = ['english', 'french', 'german'];
                        const subs: { [p: string]: string | null } | null = await this.OpenSubtitles.search(obj)
                            .then((temp: { [x: string]: { url: any; }; } | undefined) => {
                                if (temp) {
                                    let item: { [key: string]: string } = {};
                                    keys.forEach((value, pos) => {
                                        item[lang[pos]] = temp[value] === undefined ? null : temp[value].url;
                                    });
                                    return item;
                                } else return null;
                            }).catch((error: any) => {
                                console.log(error)
                                return null;
                            })

                        if (subs) {
                            await prisma.video.update({where: {id: videoId}, data: subs});
                            if (auth)
                                for (let item of lang)
                                    if (subs[item])
                                        returnSubs.push({
                                            language: item,
                                            url: '/api/stream/subtitles?auth=' + auth + '&language=' + subs[item]
                                        })
                        }
                    }
                }
            }
        }

        return returnSubs;
    }
}

export class Update {

    /**
     * @desc scans the library for new seasons and episodes
     * @returns {Promise<void>}
     */
    async scanEpisodes(thoroughScan: boolean, fixEntries = false) {
        const shows = (await prisma.folder.findMany({select: {location: true, media: true}})).reverse();
        const episodes = await prisma.episode.findMany({include: {video: true}});
        for (let show of shows)
            await this.scanShow(fixEntries, thoroughScan, show, episodes);

        const subs = new Subtitles();
        await subs.getSubs();
    }

    /**
     * @desc scans, renames and saves files in a season folder that might be difficult for scanEpisodes
     * @param folder
     * @param show
     * @param seasonId
     * @returns {Promise<void>}
     */
    async renameAndScan(folder: drive_v3.Schema$File, show: Med, seasonId?: number) {
        let files = await drive.readFolder(folder.id!);
        await prisma.episode.deleteMany({where: {seasonId, showId: show.id}});

        seasonId = seasonId || 1;
        let temp = (seasonId > 9 ? '' : '0') + seasonId;

        for (let i = 0; i < files.length; i++) {
            let ext = path.extname(files[i].name!)
            let episode_number = (i + 1 > 9 ? '' : '0') + (i + 1);
            let matches = rename(files[i].name, dicDo).match(/\d{2}|\d/g);
            episode_number = matches && matches.length ? matches[matches.length - 1] : episode_number;
            let name = `${show.name} S${temp}E${episode_number}${ext}`;
            await drive.renameFile(files[i].id!, name);
            await mediaClass.addEpisode(show.id, files[i], parseInt(episode_number), seasonId);
        }
    }

    /**
     * @desc handles the recognition and storing of each episode file
     * @param show
     * @param folder
     * @param file
     * @param thoroughScan
     * @param fixEntry
     * @param previous
     * @param seasonId
     */
    async handleEpisodes(show: Med, folder: drive_v3.Schema$File, file: drive_v3.Schema$File, thoroughScan: boolean, fixEntry: boolean, previous: { seasonId: number, episode: number } | null, seasonId?: number): Promise<{ previous: { seasonId: number, episode: number } | null, break?: boolean }> {
        const ext = path.extname(file.name!)
        if ((ext === '.mp4' || ext === '.m4v') && file.mimeType !== 'application/vnd.google-apps.folder' && file.size !== '0') {
            let name = file.name!.replace(/\(.*?\)|\[.*?]/g, '');
            name = rename(name, dicDo);
            let res: { groups: { episode: string, season?: string } } | null = null;
            let matches = name.match(/s(?<season>\d+).*?e(?<episode>\d+)/i);
            if (matches === null) {
                matches = name.match(/\d{2}/g);
                let index = /^\d{2}/.test(name) || /e\d{2}.*?e\d{2}/i.test(name) ? 0 : matches ? matches.length - 1 : -1;
                if (/\d{3}/.test(name) && !/^\d{2}/.test(name))
                    matches = /episode.*?\d{3}/i.test(name) ? name.match(/(?<episode>\d{3})/) : name.match(/(?<season>\d)(?<episode>\d{2})/);

                res = matches && matches.groups === undefined && matches.length ? {groups: {episode: matches[index]}} : null;

                if (matches === null && fixEntry) {
                    await this.renameAndScan(folder, show, seasonId);
                    return {previous, break: true}
                }
            }

            if (res === null && matches && matches.groups)
                res = {groups: {episode: matches.groups.episode, season: matches.groups.season}};

            if (res) {
                let eID = parseInt(res.groups.episode);
                seasonId = seasonId === undefined && res.groups.season ? parseInt(res.groups.season) : seasonId;

                if (seasonId === undefined)
                    return {previous};

                if (previous !== {seasonId, episode: eID}) {
                    previous = {seasonId, episode: eID};

                    await mediaClass.addEpisode(show.id, file, eID, seasonId);

                    if (!thoroughScan)
                        await prisma.media.update({
                            where: {id: show.id}, data: {
                                updated: new Date()
                            }
                        })

                } else {
                    await this.renameAndScan(folder, show, seasonId);
                    return {previous, break: true}
                }
            }
        } else
            await drive.deleteFile(file.id!)

        return {previous}
    }

    /**
     * @desc makes the data comprehensible by the front end
     * @param type
     * @param tmdbId
     */
    async interpretImages(type: MediaType, tmdbId: number): Promise<{ logos: FrontImage[], backdrops: FrontImage[], posters: FrontImage[] }> {
        let posters: FrontImage[] = [];
        let backdrops: FrontImage[] = [];
        let logos: FrontImage[] = [];
        let data = await getDetails(type, tmdbId);

        if (data) {
            let name = data.title ? data.title : data.name || '';
            const apple = await getAppleImages(type, name);
            const {logos: logo, posters: poster, backdrops: backdrop} = await getAllImages(type, tmdbId, name);

            posters = poster;
            logos = logo;
            backdrops = backdrop
            let category = type === MediaType.MOVIE ? 'Movie' : 'Show';
            let info = apple.map(item => {
                return {
                    name: item.title,
                    category: item.type,
                    images: item.images,
                }
            });

            info = info.filter(item => item.category === category);
            let result: Array<{ backdrop: string, poster: string, logo: string, name: string }> = [];
            for (let item of info) {
                let res = item.images;
                let data: { [p: string]: any, backdrop: any, poster: any, logo: any } = {
                    poster: res.coverArt16X9 ? res.coverArt16X9 : '',
                    backdrop: res.previewFrame ? res.previewFrame : '',
                    logo: res.fullColorContentLogo ? res.fullColorContentLogo : res.singleColorContentLogo ? res.singleColorContentLogo : ''
                }

                for (const item in data) {
                    let format = '.' + (item === 'logo' ? 'png' : 'jpg');
                    let val = data[item];
                    let matches = val === '' ? false : val.url.match(/(?<link>.+?)(?=\/{w})/);
                    if (matches && matches.groups)
                        data[item] = matches.groups.link + '/' + val.width + 'x' + val.height + format;
                }

                result.push({...data, name: item.name});
            }

            for (let item of result) {
                const drift = item.name.Levenshtein(name);
                const likes = Math.ceil(20 / (drift === 0 ? 1 : drift));
                if (item.poster !== '')
                    posters.push({drift, language: null, likes, name: item.name, url: item.poster});

                if (item.backdrop !== '')
                    backdrops.push({drift, language: null, likes, name: item.name, url: item.backdrop});

                if (item.logo !== '')
                    logos.push({drift, language: null, likes, name: item.name, url: item.logo});
            }

            logos = logos.sortKeys('drift', 'likes', true, false);
            backdrops = backdrops.sortKeys('drift', 'likes', true, false);
            posters = posters.sortKeys('drift', 'likes', true, false);
        }

        return {logos, posters, backdrops};
    }

    /**
     * @desc searches several DBs for images for a show || movie
     * @param type
     * @param tmdbId
     */
    async getImages(type: MediaType, tmdbId: number): Promise<{ name: string, year: number, apple: AppleIMages[], images: UpdateImages } | null> {
        let data = await getDetails(type, tmdbId);
        if (data === false)
            return null;

        let name = data.title ? data.title : data.name || '';
        let release_date = data.release_date || data.first_air_date;
        const apple = await getAppleImages(type, name);
        const images = await getFramesImage(type, tmdbId, name);

        return {...{apple, images}, ...{name, year: new Date(release_date).getFullYear()}};
    }

    /**
     * @desc makes a calculated decision on the right image of an entry for automatic inserts info into database
     * @param type
     * @param tmdbId
     */
    async sift(type: MediaType, tmdbId: number): Promise<false | UpdateInterface> {
        let res: any;
        let category = type === MediaType.MOVIE ? 'Movie' : 'Show';
        let response = await this.getImages(type, tmdbId);

        if (response === null)
            return false;

        let {name, year} = response;
        let info = response.apple.map(item => {
            return {
                name: item.title,
                category: item.type,
                drift: item.title.Levenshtein(name),
                images: item.images,
                year: new Date(item.releaseDate).getFullYear()
            }
        }).sortKey('drift', true);

        if (MediaType.MOVIE === type && info.length > 1)
            info = info.filter(item => item.category === category && (year - 1 <= item.year && item.year <= year + 1) && item.drift < 3);

        else if (MediaType.SHOW === type && info.length > 1)
            info = info.filter(item => item.category === category && item.drift < 3);

        if (info.length && info[0].drift <= response.images.name.Levenshtein(name) + 1) {
            res = info[0].images;
            res = {
                poster: res.coverArt16X9 ? res.coverArt16X9 : '',
                backdrop: res.previewFrame ? res.previewFrame : '',
                logo: res.fullColorContentLogo ? res.fullColorContentLogo : res.singleColorContentLogo ? res.singleColorContentLogo : ''
            }

            for (const item in res) {
                if (res.hasOwnProperty(item)) {
                    let format = '.' + (item === 'logo' ? 'png' : 'jpg');
                    let val = res[item];
                    let matches = val === '' ? false : val.url.match(/(?<link>.+?)(?=\/{w})/);
                    if (matches && matches.groups)
                        res[item] = matches.groups.link + '/' + val.width + 'x' + val.height + format;
                }
            }

            res.name = info[0].name;
        } else res = response.images;

        res.logo = res.logo === '' ? response.images.logo : res.logo;
        res = {...res, ...{tmdbId, type}};
        for (let item in res)
            if (res.hasOwnProperty(item) && res[item] === '' && !['logo', 'tmdbId', 'type', 'trailer'].some(key => key === item))
                return false;

        return res;
    }

    /**
     * @desc scans for a media's metadata
     * @param item
     * @param type
     */
    async scanForMedia(item: drive_v3.Schema$File, type: MediaType) {
        if (type === MediaType.MOVIE) {
            const ext = path.extname(item.name!)
            if ((ext === '.mp4' || ext === '.m4v')) {
                let name: string, year: number;
                let regex = /(?<name>^.*?)\.(?<year>\d{4})\.\d+p[^"]+/
                let matches = item.name!.match(regex);

                if (matches && matches.groups) {
                    name = matches.groups.name;
                    year = parseInt(matches.groups.year);
                    name = rename(name, dicDo);

                } else {
                    let data = item.name!.match(/(?<name>^.*?)\d+p/);
                    name = data && data.groups && data.groups.name ? data.groups.name : item.name!;
                    name = rename(name, dicDo);
                    data = name.match(/\d{4}/g);
                    let temp = data && data.length ? data[data.length - 1] : new Date().getFullYear();
                    year = parseInt(`${temp}`);
                    name = name.replace(`${temp}`, '');
                }

                year = parseInt(`${year}`);
                let backup: any[], results: any[];
                let response = await search(MediaType.MOVIE, name);

                results = response && response.results ? response.results.map(item => {
                    return {
                        tmdbId: item.id,
                        name: item.title,
                        drift: item.title.Levenshtein(name),
                        popularity: item.popularity,
                        backdrop: item.backdrop_path,
                        year: new Date(item.release_date).getFullYear()
                    }
                }) : []

                backup = results.filter(item => (year - 1 <= item.year && item.year <= year + 1) && (name.strip(item.name) || item.drift < 5));
                backup = backup.length > 1 ? backup.filter(item => item.year === year && item.drift < 3) : backup;
                backup = backup.length > 1 ? backup.filter(item => item.drift < 2) : backup;
                backup = backup.length > 1 ? backup.filter(item => item.drift < 1) : backup;

                if (backup.length < 1 && year === new Date().getFullYear()) {
                    backup = results.filter(item => item.backdrop !== null).sortKeys('drift', 'popularity', true, false);
                    backup = backup.length ? [backup[0]] : [];
                }

                if (backup.length > 1) {
                    backup = backup.filter(item => item.backdrop !== null).sortKeys('drift', 'popularity', true, false);
                    backup = backup.length ? [backup[0]] : [];
                }

                [backup, results] = [results, backup];
                return {backup, results}
            }
            return {backup: [], results: []}
        } else {
            const response = await search(MediaType.SHOW, item.name || '');
            let results = response && response.results ? response.results : [];
            let backup = results.map(show => {
                return {
                    tmdbId: show.id,
                    name: show.name,
                    drift: show.name!.Levenshtein(item.name!),
                    popularity: show.popularity,
                    backdrop: show.backdrop_path,
                    year: new Date(show.first_air_date).getFullYear()
                }
            }).sortKeys('drift', 'popularity', true, false);

            if (backup.length > 1) {
                const temp = backup.filter(e => e.drift === 0);
                backup = temp.length ? temp : backup;
            }

            return {backup: backup.length ? [backup[0]] : [], results: results}
        }
    }

    /**
     * @desc [BETA 2.0] Attempts to scan the libraries for new entries
     * @returns {Promise<void>}
     */
    async autoScan(moviesFolder = movies, showsFolder = tvShows) {
        let films = moviesFolder === '' ? [] : await drive.readFolder(moviesFolder);
        let shows = showsFolder === '' ? [] : await drive.readFolder(showsFolder);
        const episodes = await prisma.episode.findMany({include: {video: true}});

        const media = await prisma.media.findMany();
        films = (await prisma.video.findMany({where: {episode: null}})).filterInFilter(films, 'location', 'id');
        shows = (await prisma.folder.findMany()).filterInFilter(shows, 'location', 'id');
        for (let item of films) {
            let {backup, results} = await this.scanForMedia(item, MediaType.MOVIE);
            if (results.length === 1 || backup.length === 1) {
                let obj = results.length ? results[0] : backup[0];
                const data = await this.sift(MediaType.MOVIE, obj.tmdbId);
                if (media.some(e => e.tmdbId === obj.tmdbId && e.type === MediaType.MOVIE))
                    continue;

                if (data)
                    await mediaClass.addMedia(data, item.id!);
            }
        }

        for (let item of shows) {
            const {results, backup} = await this.scanForMedia(item, MediaType.SHOW);
            if (results.length === 1 || backup.length === 1) {
                let show = backup.length ? backup[0] : results[0];
                let obj = await this.sift(MediaType.SHOW, show.tmdbId);
                if (media.some(e => e.tmdbId === show.tmdbId && e.type === MediaType.MOVIE))
                    continue;

                if (obj) {
                    await mediaClass.addMedia(obj, item.id!);
                    const media = await prisma.media.findFirst({where: {tmdbId: obj.tmdbId}});
                    if (media) {
                        const show = {media, location: item.id!};
                        await this.scanShow(false, false, show, episodes);
                    }
                }
            }
        }

        const subs = new Subtitles();
        await subs.getSubs();
    }

    /**
     * @desc gets the subs for missing videos
     */
    async getSubs() {
        const videos = await prisma.video.findMany({where: {OR: [{english: null}, {german: null}, {french: null}]}});

        await prisma.sub.deleteMany();
        const subs = videos.reverse().map(e => {
            return {
                videoId: e.id
            }
        })

        await prisma.sub.createMany({data: subs});
        const sub = new Subtitles();
        await sub.getSubs();
    }

    /**
     * @desc scans a show for new episodes
     * @param fixEntries
     * @param thoroughScan
     * @param show
     * @param episodes
     */
    async scanShow(fixEntries: boolean, thoroughScan: boolean, show: { media: Med, location: string }, episodes: (Episode & { video: Video })[]) {
        const showEpisodes = episodes.filter(e => e.showId === show.media.id);

        if (!thoroughScan) {
            const seasons = showEpisodes.uniqueID('seasonId');
            const tvShow = await getDetails(MediaType.SHOW, show.media.tmdbId);
            if (tvShow && tvShow.number_of_seasons === seasons.length && tvShow.number_of_episodes === showEpisodes.length)
                return;
        }

        const seasons = await drive.readFolder(show.location);
        for (const season of seasons) {
            let previous: { seasonId: number, episode: number } | null = null;
            if (season.mimeType === 'application/vnd.google-apps.folder') {
                let files = await drive.readFolder(season.id!);
                let matches = season.name!.match(/Season\s(?<season>\d+)/i);

                if (matches === null || matches.groups === undefined)
                    continue;

                let seasonId = parseInt(matches.groups.season);
                if (season.name !== 'Season ' + seasonId)
                    await drive.renameFile(season.id!, 'Season ' + seasonId);

                let check = showEpisodes.filter(item => item.seasonId === seasonId)
                if (!thoroughScan && check.length === files.length)
                    continue;

                for (const episode of files) {
                    const obj: { previous: { seasonId: number; episode: number } | null; break?: boolean } = await this.handleEpisodes(show.media, season, episode, thoroughScan, fixEntries, previous, seasonId);
                    previous = obj.previous;
                    if (obj.break)
                        break;
                }
            } else
                await this.handleEpisodes(show.media, season, season, thoroughScan, fixEntries, previous);
        }
    }

    /**
     * @desc searches for an entry and checks for availability on the database
     * @param name
     */
    async improveSearch(name: string) {
        const res = await performSearch(name);
        const media = await prisma.media.findMany();

        for (let item of res) {
            if (item.type !== 'person') {
                const type = item.type === 'movie' ? MediaType.MOVIE : MediaType.SHOW;
                const temp = media.find(e => e.type === type && e.tmdbId === item.id);
                item.present = temp !== undefined;
                if (temp)
                    item.libName = temp.name;
                item.recom = false;
            }
        }

        return res;
    }

    /**
     * @desc gets the all the drive items that hasnt' bveen added to frames yet
     */
    async getUnScanned(): Promise<FrontTmDB> {
        let films = await drive.readFolder(movies);
        let shows = await drive.readFolder(tvShows);
        const media = await prisma.media.findMany();

        films = (await prisma.video.findMany({where: {episode: null}})).filterInFilter(films, 'location', 'id');
        shows = (await prisma.folder.findMany()).filterInFilter(shows, 'location', 'id');

        const moviesRes: FrontBit[] = [];
        const showsRes: FrontBit[] = [];

        for (let item of films) {
            const {results, backup} = await this.scanForMedia(item, 'MOVIE');
            let res = results.length ? results : backup;
            const med = media.find(e => e.type === MediaType.MOVIE && e.tmdbId === res[0]?.tmdbId);
            res = res.map(e => {
                e.backdrop = "https://image.tmdb.org/t/p/original" + e.backdrop;
                return e;
            })

            moviesRes.push({file: item, res, type: MediaType.MOVIE, available: !!med, name: med?.name || undefined});
        }

        for (let item of shows) {
            const {results, backup} = await this.scanForMedia(item, 'SHOW');
            let res = results.length ? results : backup;
            const med = media.find(e => e.type === MediaType.SHOW && e.tmdbId === res[0]?.tmdbId);
            res = res.map(e => {
                e.backdrop = "https://image.tmdb.org/t/p/original" + e.backdrop;
                return e;
            })
            showsRes.push({file: item, res, type: MediaType.SHOW, available: !!med, name: med?.name || undefined});
        }

        return {movies: moviesRes, shows: showsRes};
    }

    /**
     * @desc performs a search on Tmdb for person movie or show matching the search value
     * @param searchValue
     */
    async performSearch(searchValue: string): Promise<UpdateSearch[]> {
        return await prisma.media.findMany({
            where: {name: {contains: searchValue}},
            select: {name: true, backdrop: true, logo: true, poster: true, type: true, id: true, overview: true}
        });
    }

    /**
     * @desc gets the media file for editing in the client side
     * @param mediaId
     */
    async findFile(mediaId: number): Promise<{ file: drive_v3.Schema$File | null, tmdbId: number } | null> {
        const media = await prisma.media.findFirst({where: {id: mediaId}});
        if (media)
            if (media.type === 'MOVIE') {
                const file = await prisma.video.findFirst({where: {mediaId}});
                if (file)
                    return {file: await drive.getFile(file.location), tmdbId: media.tmdbId};
            } else {
                const file = await prisma.folder.findFirst({where: {showId: mediaId}});
                if (file)
                    return {file: await drive.getFile(file.location), tmdbId: media.tmdbId};
            }

        return null;
    }

    /**
     * @desc searches through frames library for item that matches
     * @param name
     * @param type
     */
    async mediaSearch(name: string, type: MediaType) {
        const media = await prisma.media.findMany();
        const response = await search(type, name);

        const movies: UpdateMediaSearch[] = response && response.results ? response.results.filter(e => e.backdrop_path !== null && e.overview !== '').map(e => {
            return {
                popularity: e.popularity,
                name: e.name ? e.name : e.title,
                drift: e.name ? e.name.Levenshtein(name) : e.title.Levenshtein(name),
                type: !!e.name ? MediaType.SHOW : MediaType.MOVIE,
                id: e.id,
                overview: e.overview,
                date: e.release_date || 'null',
                backdrop: "https://image.tmdb.org/t/p/original" + e.backdrop_path
            }
        }) : [];

        const data: UpdateMediaSearch[] = [];
        for (let item of movies) {
            const temp = media.find(e => e.type === type && e.tmdbId === item.id);
            if (temp === undefined)
                data.push(item);
        }

        return data;
    }

    /**
     * @desc searches to see if media already exists before it's added on the client side during the editing process
     * @param tmdbId
     * @param type
     */
    async getMedia(tmdbId: number, type: MediaType): Promise<{ file: string, found: boolean } | false> {
        const media = await getDetails(type, tmdbId);

        if (media) {
            const file = await prisma.media.findFirst({where: {AND: [{type}, {tmdbId}]}});
            if (file)
                return {file: file.name, found: true};

            return {file: '' + (media.name || media.title), found: false};
        }

        return false;
    }
}