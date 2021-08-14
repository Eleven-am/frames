import Deluge from 'deluge-client';
import env from '../base/env';
import {get, formatBytes, toBytes} from "../base/baseFunctions";
import {getDetails, getExternalId} from "../base/tmdb_hook";
const NzbGet = require('@jc21/nzbget-jsonrpc-api').Client;
const environment = env.config
const usenet = environment.usenet;
const rarBgApi = require('rarbg-api');
const Torrent = require('torrent-search-api')

const options = {
    min_seeders: 5,
    category: rarBgApi.CATEGORY.TV_HD_EPISODES,
    format: 'json_extended',
    limit: 100,
    ranked: 0
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

interface RarBgApi {
    title: string;
    download: string;
    seeders: number;
    size: number;
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

export default class Magnet {
    private readonly deluge;
    private readonly providers = Torrent.getProviders();

    constructor() {
        if (environment.deluge){
            this.deluge = new Deluge(environment.deluge.deluge_url, environment.deluge.password, environment.deluge.directory);
            for (let provider of this.providers)
                if (provider.public)
                    Torrent.enableProvider(provider.name);

        } else this.deluge = null;
    }

    /**
     * @desc gets a movie's magnet link from YTS/RARBG/ALL other Providers;
     * @param tmdb_id
     */
    async findMovie(tmdb_id: number) {
        if (this.deluge === null)
            return false;

        let data: {url: string, size: string} | null = null;
        const details = await getDetails('MOVIE', tmdb_id);
        const external = await getExternalId(tmdb_id, 'MOVIE');
        if (details && external && external.imdb_id) {
            const name = details.title;
            const year = new Date(details.release_date).getFullYear();
            let url = 'https://yts.mx/api/v2/list_movies.json?query_term=' + external.imdb_id;
            let prefix = 'magnet:?xt=urn:btih:';
            let trackers = '&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337';
            const yts: Yts | false = await get(url);

            if (yts && yts.data && yts.data.movies) {
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
                        url = prefix + hash + '&dn=' + name + trackers;
                        data = {url, size};
                    }
                }
            }

            if (data === null){
                let movies = options;
                movies.category = rarBgApi.CATEGORY.MOVIES_X264_1080P;
                let response: RarBgApi[] = await new Promise(resolve => {
                    setTimeout(() => resolve([]), 3000)

                    rarBgApi.search(external.imdb_id, movies, 'imdb')
                        .then((data: RarBgApi[]) => resolve(data))
                        .catch((err: string) => {
                            if (err === 'Cant find imdb in database. Are you sure this imdb exists?')
                                return rarBgApi.search(tmdb_id, options, 'themoviedb')
                                    .then((data: RarBgApi[]) => resolve(data))
                                    .catch((err: any) => console.error(err));
                        });
                })

                if (response.length) {
                    const file = response[0];
                    data = {url: file.download, size: formatBytes(file.size)}

                } else {
                    const response: TorrentApi[] = await Torrent.search(name);
                    let resolve = []
                    for (let item of response) {
                        let regex = /[sS]\d{2}.*?[eE]\d{2}|[sS]eason|[sS]\d{2}|[sS]eries/
                        let matches = item.title.match(/(?<year>\d{4})/);
                        const matchYear = matches && matches.groups && matches.groups.year ? matches.groups.year: '0';
                        if (matches !== null && parseInt(matchYear) === year && !regex.test(item.title))
                            resolve.push(item)
                    }

                    if (resolve.length) {
                        const response = resolve[0];
                        data = {url: await Torrent.getMagnet(response), size: response.size}
                    }
                }
            }

            if (data)
                return await this.download(data.url);
        }

        return false;
    }

    /**
     * @desc gets a show's magnet link from /RARBG/ALL other Providers;
     * Checks for episode link if episode specified else gets season link
     * @param tmdb_id
     * @param season
     * @param episode?
     */
    async findSeason(tmdb_id: number, season: number, episode?: number) {
        let search: string;

        if (this.deluge === null)
            return false;

        const details = await getDetails('SHOW', tmdb_id);
        const external = await getExternalId(tmdb_id, 'SHOW');
        if (details && external && external.imdb_id){
            let allProviders: TorrentApi[] = [];
            if (episode === undefined) {
                search = details.name + ' S' + (season > 9 ? '' : '0') + season;
                allProviders = allProviders.concat(await Torrent.search(search));
                search = details.name + ' Season ' + season;
                allProviders = allProviders.concat(await Torrent.search(search));
            } else {
                search = `${details.name} S${(season > 9 ? '' : '0') + season}E${(episode > 9 ? '' : '0') + episode}`;
                allProviders = allProviders.concat(await Torrent.search(search));
            }

            let response: RarBgApi[] = await new Promise((resolve) => {
                setTimeout(() => (resolve([])), 3000)

                new Promise<RarBgApi[]>((resolve1) => {
                    if (episode === undefined)
                        resolve1(rarBgApi.search(external.imdb_id, options, 'imdb'))
                    else
                        resolve1(rarBgApi.search(search, options))

                }).then(data => resolve(data))
                    .catch(err => {
                        if (err === 'Cant find imdb in database. Are you sure this imdb exists?')
                            return rarBgApi.search(tmdb_id, options, 'themoviedb')
                                .then((data: RarBgApi[]) => resolve(data))
                                .catch((err: any) => {
                                    resolve([]);
                                    console.error(err)
                                });
                    });
            });

            const proves = allProviders.map(e => {
                return {
                    title: e.title,
                    seeds: e.seeds,
                    peers: e.peers,
                    size: e.size ? toBytes(e.size): 0,
                    desc: e.desc,
                    url: e.magnet || '',
                    type: '',
                    provider: e.provider
                }
            })

            const data = response.map(item => {
                return {
                    size: item.size,
                    seeds: item.seeders,
                    url: item.download,
                    title: item.title,
                    type: 'rarBg'
                }
            }).concat(proves).filter(item => item.seeds > 4);

            let resolve = []
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

            const name = details.name || '';
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

            resolve = resolve.sortKeys('seeds', 'size', false, false);

            if (resolve.length) {
                const magnet = resolve[0].url !== ''? resolve[0].url: resolve[0].hasOwnProperty('provider') ? await Torrent.getMagnet(resolve[0]): '';
                return await this.download(magnet);
            }
        }

        return false;
    }

    private async download(magnet: string) {
        if (this.deluge){
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

    delugeActive() {
        return !!this.deluge
    }
}
