import Deluge from 'deluge-client';
import {Aggregate, External} from "./tmdb";
import {MediaType} from "@prisma/client";
import {regrouped} from "../lib/environment";
import Parser from 'rss-parser';

const rarBgApi = require('rarbg-api');
const Torrent = require('torrent-search-api');

interface RarBgApi {
    title: string;
    download: string;
    seeders: number;
    size: number;
}

interface Yts {
    data?: {
        movies?: {
            title_long: string;
            torrents?: {
                quality: string;
                type: string;
                hash: string;
                size: string;
            }[]
        }[]
    }
}

interface TorrentApi {
    title: string;
    seeds: number;
    size: string;
    magnet: string;
    desc: string;
    peers: number;
    provider: string;
    url: string;
    type: string;
}

interface AggregatedTorrents {
    title: string,
    seeds: number,
    peers?: number,
    size: number,
    desc?: string,
    url: string,
    type: string,
    provider?: string
}

export default class Magnet extends Aggregate {
    private readonly deluge;
    private readonly ytsBaseUrl: string;
    private readonly providers = Torrent.getProviders();

    constructor() {
        super(regrouped.tmdbToken!);
        this.ytsBaseUrl = ' https://yts.mx/api/v2/list_movies.json';

        if (regrouped.deluge) {
            const {deluge_url, password, directory} = regrouped.deluge;
            this.deluge = new Deluge(deluge_url, password, directory);

        } else this.deluge = null;

        for (let provider of this.providers)
            if (provider.public)
                Torrent.enableProvider(provider.name);
    }

    /**
     * @desc get torrents from rarbg and yts
     * @param id - tmdb id
     * @param type - movie or tv
     */
    async addMagnet(id: number, type: MediaType) {
        if (!this.deluge) return;
        let res : {url: any, size: string} | null;

        if (type === MediaType.MOVIE)
            res = await this.getMovie(id);

        else
            res = await this.getSeasonTorrent(id, 1);

        if (!res) return;
        const {url, size} = res;
        await this.download(url);
        return {url, size};
    }

    /**
     * @desc scans the yts rss feed for files to download
     */
    async parseFeed() {
        if (this.deluge) {
            let parser = new Parser();
            const feed = await parser.parseURL('https://yts.mx/rss/0/1080p/all/0/en');
            for await (const item of feed.items)
                await this.deluge.add(item.enclosure?.url || '');
        }
    }

    /**
     * @desc Get torrents from the providers
     * @param id - The TMDB id of the movie
     */
    async getMovie(id: number) {
        const movie = await this.getMedia(id, MediaType.MOVIE) || null;
        if (!movie) return null;

        const externalIds = movie.external_ids;
        const imdbId = externalIds.imdb_id;
        const year = new Date(movie.release_date).getFullYear();

        let prefix = 'magnet:?xt=urn:btih:';
        let trackers = '&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337';

        const params = {
            query_term: imdbId,
            sort_by: 'seeds',
            order_by: 'desc',
            limit: '1',
            with_rt_ratings: 'true'
        };

        const yts = await this.makeRequest<Yts>(this.ytsBaseUrl, params);
        if (yts?.data?.movies && yts.data.movies.length > 0) {
            let {title_long, torrents} = yts.data.movies[0];
            if (torrents) {
                if (torrents.length > 1)
                    torrents = torrents.filter(file => file.quality === '1080p' || file.quality === '2160p');

                if (torrents.length > 1)
                    torrents = torrents.filter(file => file.quality === '1080p');

                if (torrents.length > 1)
                    torrents = torrents.filter(file => file.type === 'bluray');

                if (torrents.length) {
                    let {quality, hash, size} = torrents[0];
                    let name = `${title_long} [${quality}] [YTS.MX]`;
                    name = encodeURI(name).replace(/%20/g, '+');
                    name = name.replace(/\(/g, '%28').replace(/\)/g, '%29');
                    const url = prefix + hash + '&dn=' + name + trackers;
                    return {url, size};
                }
            }
        }

        let data = await this.makeRarBGRequest(externalIds, movie.title || '', MediaType.MOVIE);
        data = this.sortArray(data, ['size', 'seeders'], ['desc', 'desc']);
        if (data.length > 0) {
            let {download, size} = data[0];
            return {url: download, size: this.formatBytes(size)};
        }

        let resolve = [];
        let response = await this.makeTorrentRequest(movie.title || '');
        response = this.sortArray(response, ['size', 'seeds'], ['desc', 'desc']);

        for (let item of response) {
            let regex = /[sS]\d{2}.*?[eE]\d{2}|[sS]eason|[sS]\d{2}|[sS]eries/
            let matches = item.title.match(/(?<year>\d{4})/);
            const matchYear = matches && matches.groups && matches.groups.year ? matches.groups.year : '0';
            if (matches !== null && parseInt(matchYear) === year && !regex.test(item.title))
                resolve.push(item)
        }

        if (resolve.length) {
            const response = resolve[0];
            return {url: await Torrent.getMagnet(response), size: response.size}
        }

        return null;
    }

    /**
     * @desc Get torrents from the providers
     * @param id - The TMDB id of the movie
     * @param season - The season number
     * @param episode - The episode number
     */
    async addSeasonTorrent(id: number, season: number, episode?: number) {
        const torrent = await this.getSeasonTorrent(id, season, episode);
        if (!torrent) return;
        const {url, size} = torrent;
        await this.download(url);
        return {url, size};
    }

    /**
     * @desc Get the magnet link for a torrent
     * @param id - The id of the torrent
     * @param season - The season of the torrent
     * @param episode - The episode of the torrent
     */
    async getSeasonTorrent(id: number, season: number, episode?: number): Promise<{url: any, size: string} | null> {
        let search: string;
        let allProviders: TorrentApi[] = [];

        const details = await this.getMedia(id, MediaType.SHOW) || null;

        if (!details) return null;

        const externalIds = details.external_ids;

        const response = await this.makeRarBGRequest(externalIds, details.name || '', MediaType.SHOW, episode);

        const data: AggregatedTorrents[] = response.map(item => {
            return {
                size: item.size,
                seeds: item.seeders,
                url: item.download,
                title: item.title,
                type: 'rarBg'
            }
        });

        const sifted = await this.sift(data, season, details.name || '', episode);
        if (sifted)
            return sifted;

        if (episode === undefined) {
            search = details.name + ' S' + (season > 9 ? '' : '0') + season;
            allProviders = await this.makeTorrentRequest(search);
            search = details.name + ' Season ' + season;
            allProviders = allProviders.concat(await this.makeTorrentRequest(search));
        } else {
            search = `${details.name} S${(season > 9 ? '' : '0') + season}E${(episode > 9 ? '' : '0') + episode}`;
            allProviders = allProviders.concat(await Torrent.search(search));
        }

        const proves: AggregatedTorrents[] = allProviders.map(e => {
            return {
                title: e.title,
                seeds: e.seeds,
                peers: e.peers,
                size: e.size ? this.toBytes(e.size) : 0,
                desc: e.desc,
                url: e.magnet || '',
                type: '',
                provider: e.provider
            }
        })

        const res = await this.sift(proves, season, details.name || '', episode);
        if (res)
            return res;

        else if (episode === undefined)
            return this.getSeasonTorrent(id, season, 1);

        else return null;
    }

    /**
     * @desc add torrent to the deluge client
     * @param magnet {string} - magnet link
     */
    async download(magnet: string) {
        if (this.deluge) {
            if (!await this.deluge.isConnected()) {
                const hosts = await this.deluge.getHosts();
                if (hosts)
                    await this.deluge.connect(hosts[0].id);

                else throw new Error('Deluge is not configured correctly')
            }

            await this.deluge.add(magnet);
            return true;
        } else return false;
    }

    /**
     * @desc checks if the deluge client is connected
     */
    async delugeActive() {
        return !!this.deluge;
    }

    /**
     * @desc make a request to the rarbg api
     * @param external - ids of the media
     * @param search - query to search for
     * @param type - type of media
     * @param episode - episode number
     */
    protected async makeRarBGRequest(external: External, search: string, type: MediaType, episode?: number) {
        const options = {
            min_seeders: 5,
            category: type === 'SHOW' ? rarBgApi.CATEGORY.TV_HD_EPISODES : rarBgApi.CATEGORY.MOVIES_X264_1080P,
            format: 'json_extended',
            limit: 100,
            ranked: 0
        };

        return new Promise<RarBgApi[]>(async (resolve) => {
            setTimeout(() => (resolve([])), 3000);

            return new Promise<RarBgApi[]>(() => {
                if (episode === undefined)
                    resolve(rarBgApi.search(external.imdb_id, options, 'imdb'));
                else
                    resolve(rarBgApi.search(search, options));

            }).catch(err => {
                if (err === 'Cant find imdb in database. Are you sure this imdb exists?')
                    return rarBgApi.search(external.id, options, 'themoviedb')
                        .then((data: RarBgApi[]) => resolve(data))
                        .catch((err: any) => {
                            resolve([]);
                            console.error(err)
                        });
            });
        })
    }

    /**
     * @desc Make a request to torrent api
     * @param query - Search query
     * @protected
     */
    protected async makeTorrentRequest(query: string) {
        return new Promise<TorrentApi[]>(async (resolve) => {
            setTimeout(() => (resolve([])), 3000);

            Torrent.search(query)
                .then((data: TorrentApi[]) => {
                    resolve(data)
                })
                .catch((err: any) => {
                    resolve([]);
                    console.error(err)
                });
        });
    }

    /**
     * Sift through the torrents to find the best one
     * @param data - The torrents to sift through
     * @param season - The season of the episode
     * @param name - The name of the show
     * @param episode - The episode number
     */
    private async sift(data: AggregatedTorrents[], season: number, name: string, episode?: number) {
        let resolve = [];

        if (episode === undefined) {
            for (let item of data) {
                let regex = /[sS](?<season>\d{2})/;
                let matches = item.title.match(regex);
                if (matches && matches.groups) {
                    if (parseInt(matches.groups.season) === season && !/Episode|E[\s-]*\d+/i.test(item.title))
                        resolve.push(item);

                } else {
                    matches = item.title.match(/[sS]eason[\s-]+(?<season>\d+)/);
                    if (matches && matches.groups)
                        if (parseInt(matches.groups.season) === season)
                            resolve.push(item);
                }
            }
        } else {
            for (let item of data) {
                let regex = /[sS](?<season>\d{2}).*?[eE](?<episode>\d{2})/;
                let matches = item.title.match(regex);
                if (matches && matches.groups)
                    if (parseInt(matches.groups.season) === season && parseInt(matches.groups.episode) === episode)
                        resolve.push(item);
            }
        }

        if (resolve.length > 1) {
            let temp = resolve.filter(item => item.title.includes(name) || item.title.includes(name.replace(/ /g, '.')));
            resolve = temp.length ? temp : resolve;
        }

        if (resolve.length > 1) {
            resolve = resolve.filter(item => !/x265|hevc/i.test(item.title));
            let temp = resolve.filter(item => item.title.includes('x264'))
            resolve = temp.length ? temp : resolve;
        }

        if (resolve.length > 1) {
            let temp = resolve.filter(item => !/blu.*?ray/i.test(item.title))
            resolve = temp.length ? temp : resolve;
            temp = resolve.filter(item => /web/i.test(item.title))
            resolve = temp.length ? temp : resolve;
        }

        if (resolve.length > 1) {
            let temp = resolve.filter(item => /(72|108)0p/.test(item.title));
            resolve = temp.length ? temp : resolve;
        }

        if (resolve.length > 1) {
            let temp = resolve.filter(item => item.title.includes('1080p'));
            resolve = temp.length ? temp : resolve;
        }

        resolve = this.sortArray(resolve, ['size', 'seeds'], ['desc', 'desc']);

        if (resolve.length >= 1) {
            const url = resolve[0].url !== '' ? resolve[0].url : resolve[0].hasOwnProperty('provider') ? await Torrent.getMagnet(resolve[0]) : '';
            const size = this.formatBytes(resolve[0].size);
            return {url, size}
        }

        return null;
    }
}