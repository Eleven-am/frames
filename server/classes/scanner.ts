import {CastType, Episode, Media, MediaType, Video} from '@prisma/client';
import {drive_v3} from "googleapis";
import path from "path";
import rename from "locutus/php/strings/strtr";
import DriveHandler from "./driveHandler";
import {Base} from "./auth";
import {tmdbEpisode} from "./tmdb";

const OS = require('opensubtitles-api');

const dicDo ={
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

export interface FrameEpisodeScan {
    name: string | null;
    overview: string | null;
    backdrop: string | null;
    seasonId: number;
    episode: number;
    showId: number;
    location: string;
}

export type Modify<T, R> = Omit<T, keyof R> & R;

interface Med extends Omit<Media, "id" | "created" | "updated" | "production" | "collection"> {
    production: { id: string, name: string }[];
    collection?: { id: number, name: string, poster: string | null };
}

interface ScanPick {
    name: string;
    tmdbId: number;
    backdrop: string | null;
    drift: number;
    popularity: number;
    year: number;
}

export class Subtitles extends Base {
    protected readonly drive: DriveHandler | null;
    private readonly OpenSubtitles;

    constructor() {
        super();
        const {openSubtitles, credentials, token, user} = this.regrouped;
        if (openSubtitles) {
            const {useragent, password, username} = openSubtitles;
            this.OpenSubtitles = new OS({useragent, username, password, ssl: true});
        } else
            this.OpenSubtitles = null;

        if (token && credentials)
            this.drive = new DriveHandler(token, credentials, user?.deleteAndRename ?? false);
        else
            this.drive = null;
    }

    /**
     * @desc builds the media object to be added to the database
     * @param imageData - the image data to be added to the media object
     * @param obj - the media object to be added to the database
     * @param type - the type of media to be added to the database
     */
    public async buildMediaObj(imageData: { poster: string, backdrop: string, logo: string | null }, obj: { name: string, tmdbId: number, year: number }, type: MediaType) {
        const rep = await this.tmdb?.getMedia(obj.tmdbId, type);
        if (!rep) return null;
        if (imageData.poster === '' || imageData.backdrop === '') return null;

        let runtime: string;
        const genre = this.tmdb?.getGenre(rep) || 'Unknown';
        const rating = this.tmdb?.getRating(rep, type) || {rating: 'unrated', release: null};
        const trailer = this.tmdb?.getTrailer(rep) || '';
        const production = this.tmdb?.getProd(rep) || [];
        const castCrew = this.tmdb?.getCast(rep) || [];

        const collection = rep.belongs_to_collection ? {
            name: rep.belongs_to_collection.name,
            id: rep.belongs_to_collection.id,
            poster: rep.belongs_to_collection.poster_path ? 'https://image.tmdb.org/t/p/original' + rep.belongs_to_collection.poster_path : null
        } : undefined;

        const background = (await this.makeRequest<{ color: string }>('https://frameshomebase.maix.ovh/api/out', {
            process: 'averageColor', image: imageData.poster
        }, "POST"))?.color || 'rgba(1, 16, 28, .5)';

        if (type === MediaType.MOVIE) {
            let hours = Math.floor(rep.runtime / 60);
            let tempHours = hours !== 0 ? hours > 1 ? hours + " hours, " : hours + " hour, " : "";
            runtime = tempHours + (rep.runtime % 60) + " mins.";

        } else
            runtime = rep.episode_run_time.length ? rep.episode_run_time[0] + " mins." : "";

        const mediaData: Med = {
            urlKey: this.generateKey(13, 1),
            collection, production, overview: rep.overview || '',
            trailer, ...rating, runtime, ...imageData, background, genre,
            tmdbId: obj.tmdbId, type, name: obj.name, vote_average: rep.vote_average,
        }

        return {mediaData, castCrew};
    }

    /**
     * @desc does the actual scan for the subtitles of a specific video file
     * @param video - the video file to be scanned
     * @param auth - the authentication object
     */
    public async getSub(video: (Video & { media: Media, episode: Episode | null }), auth?: string) {
        let returnSubs: { language: string, url: string, label: string, lang: string }[] = [];
        if (this.OpenSubtitles) {
            const file = await this.drive?.getFile(video.location) || null;
            if (file) {
                let obj: any = null;
                if (video.episode) {
                    const external = await this.tmdb?.getExternalId(video.media.tmdbId, MediaType.SHOW);
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
                    const external = await this.tmdb?.getExternalId(video.media.tmdbId, MediaType.MOVIE);
                    if (external) obj = {filesize: file.size, filename: file.name, imdbid: external.imdb_id};
                }

                if (obj) {
                    obj.extensions = ['srt', 'vtt'];
                    const keys = ['en', 'fr', 'de'];
                    const lang = ['english', 'french', 'german'];
                    const labels = ['English', 'Français', 'Deutsch'];

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
                        await this.prisma.video.update({where: {id: video.id}, data: subs});
                        if (auth)
                            returnSubs = keys.map((value, pos) => {
                                return {
                                    language: this.capitalize(lang[pos]),
                                    url: subs[lang[pos]] ? '/api/stream/subtitles?auth=' + auth + '&language=' + lang[pos] : '',
                                    label: labels[pos],
                                    lang: value
                                }
                            }).filter(x => x.url !== '');
                    }
                }

            }

        }

        return returnSubs;
    }

    /**
     * @desc this is a recursive function that handles the subtitles logic
     * @param subs - the videos array to be scanned
     */
    protected async getSubs(subs: (Video & { media: Media, episode: Episode | null })[]) {
        if (this.OpenSubtitles) {

            while (subs.length) {
                await this.getSub(subs[0]);
                await new Promise<void>(resolve => {
                    setTimeout(() => {
                        subs.shift();
                        resolve();
                    }, 3000)
                })
            }
        }
    }
}

export class Scanner extends Subtitles {
    protected readonly moviesLocation: string | null;
    protected readonly showsLocation: string | null;

    constructor() {
        super();

        this.moviesLocation = this.regrouped.user?.library.movies || null;
        this.showsLocation = this.regrouped.user?.library.tvShows || null;
    }

    /**
     * @desc fixes a file name to be valid
     * @param str - the file name
     * @private
     */
    private static prepareString(str: string) {
        str = str.replace(/NaN/g, '');
        str = str.replace(/\d{3,4}p.*?$/gi, ' ');
        str = str.replace(/\(.*?\)|\[.*?]/g, ' ');
        str = str.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9]/g, ' ').toLowerCase();
        str = str.replace(/\s+/g, ' ');
        str = rename(str, dicDo);
        str = str.trim();
        return str;
    }

    /**
     * @desc searches TMDB for the best match for a given file
     * @param item - the file to be scanned
     * @param type - the type of media to be scanned
     */
    public async scanMediaHelper(item: drive_v3.Schema$File, type: MediaType) {
        const ext = path.extname(item.name!)
        let name = Scanner.prepareString(item.name!), year = 0;
        let backup: ScanPick[] = [], results: ScanPick[] = [];

        if (item.mimeType !== 'application/vnd.google-apps.folder' && type === MediaType.SHOW)
            return {backup, results};

        else if ((item.mimeType === 'application/vnd.google-apps.folder' && type === MediaType.MOVIE) || (type === MediaType.MOVIE && !(ext === '.mp4' || ext === '.m4v')))
            return {backup, results};

        if (type === MediaType.MOVIE) {
            let matches = name.match(/(?<name>^\d{4}.*?)\s+(?<year>\d{4})/);
            matches = matches ? matches : name.match(/(?<name>(^\w+.*?\d+)|^\w+.*?)\s+(?<year>\d{4})/);

            if (matches && matches.groups) {
                name = matches.groups.name;
                year = parseInt(matches.groups.year);

            } else {
                let data = item.name!.match(/(?<name>^.*?)\d+p/);
                let tmpName = data && data.groups && data.groups.name ? data.groups.name : item.name!;
                tmpName = rename(tmpName, dicDo);
                data = tmpName.match(/\d{4}/g);
                let temp = data && data.length ? data[data.length - 1] : new Date().getFullYear();
                let tmpYear = parseInt(`${temp}`);
                tmpName = tmpName.replace(`${temp}`, '');
                if (tmpYear !== new Date().getFullYear() && tmpName !== rename(item.name!, dicDo)) {
                    year = tmpYear;
                    name = tmpName;
                }
            }

            year = parseInt(`${year}`);
        }

        let response = await this.tmdb?.searchMedia(type, name) || [];
        console.log(`${type} ${name}`, response.length);

        results = response.map(item => {
            return {
                tmdbId: item.id,
                name: item.title || item.name || '',
                drift: Scanner.prepareString(item.title || item.name || '').Levenshtein(name),
                popularity: item.popularity,
                backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
                year: new Date(type === MediaType.MOVIE ? item.release_date : item.first_air_date).getFullYear()
            }
        });
        backup = this.sortArray(results, ['drift', 'popularity'], ['asc', 'desc']);

        if (type === MediaType.SHOW && backup.length > 0)
            backup = backup.length ? [backup[0]] : [];

        else if (type === MediaType.MOVIE) {
            backup = backup.filter(item => (year - 1 <= item.year && item.year <= year + 1));
            backup = backup.length > 1 ? backup.filter(item => item.year === year && item.drift < 3) : backup;
            backup = backup.length > 1 ? backup.filter(item => item.drift < 2) : backup;
            backup = backup.length > 1 ? backup.filter(item => item.drift < 1) : backup;

            if (backup.length !== 1 || (year === new Date().getFullYear() || year === 0)) {
                backup = results.filter(item => item.backdrop !== null);
                backup = this.sortArray(backup, ['drift', 'popularity'], ['asc', 'desc']);
                backup = backup.length ? [backup[0]] : [];
            }
        }

        console.log(`${type} ${name}`, backup.length);
        return {backup, results};
    }

    /**
     * @desc scans a new media item and attempts to add it to the database
     * @param item - the show folder to scan
     * @param type - the type of media to be scanned
     * @param media - the media already in the database
     * @param keepOld - whether to keep the old media or not
     */
    public async scanMedia(item: drive_v3.Schema$File, type: MediaType, media: Media[], keepOld = true) {
        let obj: { name: string, tmdbId: number, year: number };
        let {backup, results} = await this.scanMediaHelper(item, type);

        if (results.length === 1 || backup.length === 1) {
            obj = backup.length ? backup[0] : results[0];

            const existing = media.find(e => e.tmdbId === obj.tmdbId && e.type === type);

            if (existing !== undefined) {
                if (keepOld) {
                    await this.drive?.deleteFile(item.id!);
                    return;
                }

                const video = await this.prisma.folder.findFirst({where: {showId: existing.id}});
                if (video) await this.checkAndDelete(video.location, item.id as string, this.moviesLocation === '' || this.showsLocation === '');
                return;
            }

            const imageData = await this.tmdb?.getImagesForAutoScan(obj.tmdbId, obj.name || '', type, obj.year) || {
                poster: '',
                backdrop: '',
                logo: ''
            };
            const res = await this.buildMediaObj(imageData, obj, type);
            if (res) {
                await this.addMedia(res.mediaData, res.castCrew, item.id as string);
                return;
            }
        }

        console.log(`${item.name} couldn't be added no media found`);
    }

    /**
     * @desc scans the locations provided for new media to be added to the database
     * @param moviesLocation - the location of the movies
     * @param showsLocation - the location of the shows
     */
    public async scanLibrary(moviesLocation: string, showsLocation: string) {
        if (showsLocation === '' && moviesLocation === '') return;

        const media = await this.prisma.media.findMany();
        const videos = await this.prisma.video.findMany();
        const folder = await this.prisma.folder.findMany();

        let shows = await this.drive?.readFolder(showsLocation) || [];
        shows = shows.filter(file => folder.every(show => show.location !== file.id));
        for (const show of shows) await this.scanMedia(show, MediaType.SHOW, media);

        let movies = await this.drive?.recursiveReadFolder(moviesLocation) || [];
        movies = movies.filter(file => videos.every(video => video.location !== file.id));
        for (const movie of movies) await this.scanMedia(movie, MediaType.MOVIE, media);
    }

    /**
     * @desc scans the locations provided for new media to be added to the database
     */
    public async autoScan() {
        await this.scanLibrary(this.moviesLocation || '', this.showsLocation || '');
        await this.scanAllEpisodes(false, true);
        await this.scanAllSubs();
    }

    /**
     * @desc scans the media on the database for new subtitles
     */
    public async scanAllSubs() {
        const videos = await this.prisma.video.findMany({
            where: {
                OR: [{english: null}, {french: null}, {german: null}]
            }, include: {media: true, episode: true},
            orderBy: {id: 'desc'}
        });

        await this.getSubs(videos);
    }

    /**
     * @desc scans the folders in the database for new episodes to be added to the database
     * @param thoroughScan - whether to scan the entire library thoroughly or quickly
     * @param ignoreScan - whether to add irregular episodes
     */
    public async scanAllEpisodes(thoroughScan: boolean, ignoreScan = true) {
        const media = await this.prisma.media.findMany({where: {type: MediaType.SHOW}});

        for await (const m of media.reverse())
            await this.scanShow(m.id, thoroughScan, ignoreScan);

        const videos = await this.prisma.video.findMany({include: {media: true, episode: true}});
        await this.getSubs(videos);
    }

    /**
     * @desc scans the show folder and adds new episodes to be added to the database
     * @param mediaId - the id of the show to be scanned
     * @param thoroughScan - whether to scan the entire library thoroughly or quickly
     * @param ignoreScan - whether to add ignore irregular files to the database
     */
    public async scanShow(mediaId: number, thoroughScan: boolean, ignoreScan: boolean) {
        const media = await this.prisma.media.findUnique({
            where: {id: mediaId},
            include: {folder: true, episodes: {include: {video: true}}}
        });
        console.log(`Scanning ${media?.name}`, thoroughScan, ignoreScan);

        const tmdbMedia = await this.tmdb?.getMedia(media?.tmdbId || -1, 'SHOW');
        if (media && media.folder && tmdbMedia) {
            const episodes = media.episodes;

            if (episodes.length === tmdbMedia.number_of_episodes && !thoroughScan) {
                console.log(`${media.name} is up to date`);
                return;
            }

            let episodeResults = [] as FrameEpisodeScan[];
            let episodeFiles = (await this.drive?.recursiveReadFolder(media.folder.location)) || [];
            episodeFiles = thoroughScan ? episodeFiles : episodeFiles.filter(f => episodes.every(e => e.video.location !== f.id));
            const episodesToScan = episodeFiles.filter(e => e.name?.endsWith('.m4v') || e.name?.endsWith('.mp4') || e.name?.endsWith('.webm'));
            const toDelete = episodeFiles.filter(e => !e.name?.endsWith('.m4v') && !e.name?.endsWith('.mp4') && !e.name?.endsWith('.webm'));

            const Promises: any[] = [];
            toDelete.forEach(file => Promises.push(this.drive?.deleteFile(file.id!)));

            let tmdbSeasons = await this.tmdb?.getAllEpisodes(tmdbMedia.id) || {episodes: [], tmdbId: media.tmdbId};
            const seasons = (await this.drive?.readFolder(media.folder.location)) || [];
            let tmdbEpisodes = this.sortArray(tmdbSeasons.episodes.map(e => e.season).flat(), ['season_number', 'episode_number'], ['asc', 'asc']);

            episodesToScan.forEach(episode => Promises.push(this.scanEpisode(episode, seasons, tmdbEpisodes, episodeResults, ignoreScan)));
            await Promise.all(Promises);

            episodeResults = thoroughScan ? episodeResults : episodeResults.filter(e => !episodes.some(ep => ep.video.location === e.location && ep.seasonId === e.seasonId && ep.episode === e.episode));
            const failedEpisodes = episodes.filter(e => episodeResults.some(r => r.seasonId === e.seasonId && r.episode === e.episode && e.video.location !== r.location));

            let videoLocations = failedEpisodes.map(e => e.video.location);
            videoLocations = videoLocations.concat(episodeResults.map(e => e.location));

            try {
                await this.prisma.video.deleteMany({
                    where: {
                        location: {in: videoLocations},
                    }
                });
                const data: Omit<Video, 'id'>[] = episodeResults.map(e => {
                    return {
                        english: null, french: null, german: null,
                        mediaId: media.id, location: e.location,
                    }
                })
                await this.prisma.video.createMany({data});

                const videos = await this.prisma.video.findMany({
                    where: {
                        location: {in: videoLocations},
                    },
                    include: {media: true, episode: true},
                    orderBy: {id: 'desc'}
                });
                const episodes: Omit<Episode, 'id'>[] = episodeResults.map(e => {
                    const video = videos.find(v => v.location === e.location);
                    return {
                        backdrop: e.backdrop, episode: e.episode,
                        overview: e.overview, seasonId: e.seasonId,
                        showId: media.id, videoId: video!.id, name: e.name,
                        created: new Date(), updated: new Date(),
                    }
                });
                await this.prisma.episode.createMany({data: episodes});

                if (videoLocations.length > 0) {
                    await this.prisma.media.update({
                        where: {id: media.id},
                        data: {
                            updated: new Date(),
                        }
                    });
                }
            } catch (e) {
                console.log(e);
            }

        }
    }

    /**
     * @desc scans the episode file and adds the new episode to the database
     * @param file - the file to scan
     * @param seasons - the seasons in the show folder
     * @param tmdbEpisodes - the episodes in tmdb
     * @param episodes - the episodes in the database
     * @param ignoreScan - whether to scan the entire library thoroughly or quickly
     */
    public async scanEpisode(file: drive_v3.Schema$File, seasons: drive_v3.Schema$File[], tmdbEpisodes: tmdbEpisode[], episodes: FrameEpisodeScan[], ignoreScan: boolean) {
        const maxSeason = tmdbEpisodes[tmdbEpisodes.length - 1].season_number;
        const maxEpisode = tmdbEpisodes[tmdbEpisodes.length - 1].episode_number;
        const firstSeason = tmdbEpisodes[0].season_number;
        const firstEpisode = tmdbEpisodes[0].episode_number;
        let tmdbEpisode: tmdbEpisode[] = [];
        const showId = -1;

        const season = seasons.find(s => s.id === file!.parents![0]);
        let seasonMatch = season?.name!.match(/Season\s(?<season>\d+)/i) || null;
        let seasonNumber = seasonMatch ? parseInt(seasonMatch.groups!.season) : -1;
        const name = Scanner.prepareString(file.name!);
        const slimName = name.replace(/S\d+E\d+/i, '');

        let match = name.match(/(S|SEASON)\s*(?<season>\d+).*?(E|EPISODE)\s*(?<episode>\d+)/i) || null;
        match = match ? match : name.match(/^(?<firstEpisode>\d{2}) | (?<triEpisode>\d{3})/);
        seasonNumber = seasonNumber === -1 ? parseInt(match?.groups?.season || '') : seasonNumber;
        match = match ? match : name.match(/(?<anyEpisode>\d{2})/);
        let episodeNumber = parseInt(match?.groups?.episode || match?.groups?.triEpisode || match?.groups?.firstEpisode || match?.groups?.anyEpisode || '');
        episodeNumber = Math.floor(episodeNumber / (seasonNumber * 100)) === 1 ? episodeNumber - (seasonNumber * 100) : episodeNumber;

        for (const e of tmdbEpisodes) {
            const rgx = new RegExp(`(E|EPISODE)\\s*(0)*${e.episode_number}.*?(${Scanner.prepareString(e.name!)})*`, 'i');
            const rgx2 = new RegExp(`(S|SEASON)\\s*(0)*${e.season_number}.*?(E|EPISODE)\\s*(0)*${e.episode_number}`);
            const rgx3 = new RegExp(`${Scanner.prepareString(e.name!)}`);

            if (rgx.test(slimName) || rgx2.test(name) || rgx3.test(name))
                tmdbEpisode.push(e);
        }

        if (tmdbEpisode.length > 1) {
            const temp = tmdbEpisode.filter(e => name.includes(Scanner.prepareString(e.name!)));
            if (temp.length > 0)
                tmdbEpisode = temp;
        }

        if (tmdbEpisode.length > 1) {
            const temp = tmdbEpisode.filter(e => e.episode_number === episodeNumber || e.season_number === seasonNumber);
            if (temp.length > 0)
                tmdbEpisode = temp;
        }

        if (tmdbEpisode.length > 1) {
            const temp = tmdbEpisode.filter(e => e.episode_number === episodeNumber && (match?.groups?.firstEpisode !== undefined || match?.groups?.triEpisode !== undefined));
            if (temp.length > 0)
                tmdbEpisode = temp;
        }

        if (tmdbEpisode.length > 1) {
            const temp = tmdbEpisode.filter(e => e.season_number === seasonNumber && e.episode_number === episodeNumber);
            if (temp.length > 0)
                tmdbEpisode = temp;
        }

        const temp = tmdbEpisodes.find(e => e.season_number === seasonNumber && e.episode_number === episodeNumber);
        const alreadyAdded = episodes.find(e => e.seasonId === seasonNumber && e.episode === episodeNumber);
        console.log(`${name} ${seasonNumber} ${episodeNumber} ${tmdbEpisode.length} ${alreadyAdded}`);

        if (!alreadyAdded) {
            const rgx = new RegExp(`(s|season)\\s*(0)*${seasonNumber}.*?(e|episode)\\s*(0)*${episodeNumber}`, 'i');
            if (rgx.test(name) && temp) {
                const backdrop = temp.still_path ? `https://image.tmdb.org/t/p/original${temp.still_path}` : null;
                const overview = temp.overview ? temp.overview : null;
                const name = temp.name ? temp.name : null;
                const episode: FrameEpisodeScan = {
                    backdrop,
                    name,
                    overview,
                    location: file.id!,
                    seasonId: temp.season_number,
                    episode: temp.episode_number,
                    showId
                };
                episodes.push(episode);
                console.log(episodes.length)

            } else if (temp) {
                const backdrop = temp.still_path ? `https://image.tmdb.org/t/p/original${temp.still_path}` : null;
                const overview = temp.overview ? temp.overview : null;
                const name = temp.name ? temp.name : null;
                const episode: FrameEpisodeScan = {
                    backdrop,
                    name,
                    overview,
                    location: file.id!,
                    seasonId: temp.season_number,
                    episode: temp.episode_number,
                    showId
                };
                episodes.push(episode);
                console.log(episodes.length);

            } else if (tmdbEpisode.length === 1) {
                const e = tmdbEpisode[0];
                const rgx3 = new RegExp(`${Scanner.prepareString(e.name!)}`);
                const bool = [rgx3.test(slimName) && e.episode_number === episodeNumber, e.episode_number === episodeNumber && e.season_number === seasonNumber].filter(b => b).length > 1;

                if (bool) {
                    const backdrop = e.still_path ? `https://image.tmdb.org/t/p/original${e.still_path}` : null;
                    const overview = e.overview ? e.overview : null;
                    const name = e.name ? e.name : null;
                    const episode: FrameEpisodeScan = {
                        backdrop,
                        name,
                        overview,
                        location: file.id!,
                        seasonId: e.season_number,
                        episode: e.episode_number,
                        showId
                    };
                    episodes.push(episode);
                }

            } else if (firstEpisode <= episodeNumber && episodeNumber <= maxEpisode && firstSeason <= seasonNumber && seasonNumber <= maxSeason) {
                const backdrop = null;
                const overview = null;
                const name = null;
                const episode: FrameEpisodeScan = {
                    backdrop,
                    name,
                    overview,
                    location: file.id!,
                    seasonId: seasonNumber,
                    episode: episodeNumber,
                    showId
                };
                episodes.push(episode);

            } else if (ignoreScan) {
                const backdrop = null;
                const overview = null;
                const name = null;
                const episode: FrameEpisodeScan = {
                    backdrop,
                    name,
                    overview,
                    location: file.id!,
                    seasonId: seasonNumber,
                    episode: episodeNumber,
                    showId
                };
                episodes.push(episode);
            }
        }
    }

    /**
     * @desc tries to decide between two versions of a media which to keep and which to delete
     * @param oldMedia - the old media
     * @param newMedia - the new media
     * @param spare - the media to keep
     */
    private async checkAndDelete(oldMedia: string, newMedia: string, spare = false): Promise<boolean> {
        const oldDrive = await this.drive?.getFile(oldMedia);
        const newDrive = await this.drive?.getFile(newMedia);

        const deleteFile = async (file: string) => {
            if (!spare) await this.drive?.deleteFile(file);
        }

        if (newDrive && !oldDrive) await this.prisma.video.update({
            where: {location: oldMedia},
            data: {location: newMedia}
        });

        if (oldDrive && newDrive) {
            if (oldDrive.name === newDrive.name) if (oldDrive.size! >= newDrive.size!) await deleteFile(newMedia); else await deleteFile(oldMedia);

            else {
                const yts1 = /\[YTS]/.test(newDrive.name as string);
                const yts2 = /\[YTS]/.test(newDrive.name as string);

                switch (true) {
                    case yts1 && !yts2:
                        await deleteFile(newMedia);
                        break;
                    case yts2 && !yts1:
                        await this.prisma.video.update({where: {location: oldMedia}, data: {location: newMedia}});
                        await deleteFile(oldMedia);
                        break;
                    default:
                        return false;
                }
            }
        }

        return true;
    }

    /**
     * @description adds a successful scan to the database
     * @param med - the media to add
     * @param casts - the cast for the media to be added to the castCrew table
     * @param location - the location of the media
     */
    private async addMedia(med: Med, casts: { job?: string, character?: string, name: string, tmdbId: number, type: CastType }[], location: string) {
        try {
            const media = await this.prisma.media.upsert({
                where: {tmdbId_type: {tmdbId: med.tmdbId, type: med.type}}, create: {
                    ...med, created: new Date(), updated: new Date()
                }, update: {...med, updated: new Date()}
            });

            media.type === MediaType.MOVIE ? await this.prisma.video.upsert({
                where: {location},
                create: {english: null, french: null, german: null, location, mediaId: media.id},
                update: {}
            }) : await this.prisma.folder.upsert({
                where: {location}, create: {location, showId: media.id}, update: {}
            });

            await this.prisma.castCrew.deleteMany({where: {mediaId: media.id}});
            const data = casts.map(cast => ({...cast, mediaId: media.id}));
            await this.prisma.castCrew.createMany({data});

            if (media.type === MediaType.SHOW) await this.prisma.folder.deleteMany({where: {AND: [{showId: media.id}, {NOT: {location}}]}});

            if (media.type === MediaType.SHOW)
                await this.scanShow(media.id, true, true);

        } catch (e) {
            console.log(e);
        }
    }
}
