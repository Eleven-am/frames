import {
    castCrew,
    findPerson,
    FramesPerson,
    FrontSearch,
    getCollection,
    getDetails,
    getGenre,
    getMovieRating,
    getPersonInfo,
    getProd,
    getProdCompany,
    getTrailer,
    getTvRating,
    pageTwo,
    tmdbMedia,
    trending
} from '../base/tmdb_hook';
import {Media as Med, MediaType} from '@prisma/client';
import Episode, {DetailedEpisode, EpisodeInterface} from "./episode";
import {drive, magnet, prisma} from '../base/utils';
import {FrontBit, UpdateInterface} from "./update";
import {aJax} from "../base/baseFunctions";

/**
 * Only for getInfo
 */
export interface MediaInfo extends Omit<Med, "background" | "production" | "tmdbId" | "vote_average" | "collectionId" | "created" | "updated"> {
    recommendations?: Array<{ poster: string, id: number, name: string, tmdbId: number, type: boolean }>
    cast?: Array<{ character: string, name: string, id: number }>
    crew?: Array<{ job: string, name: string, id: number }>
    review?: number | null
    production: any
    section?: Array<string>
    seasons?: Array<EpisodeInterface>
}

export interface EditMedia {
    unScan?: FrontBit
    media?: MediaSection
}

export interface MediaSection {
    id: number,
    name: string,
    backdrop?: string,
    logo?: string,
    type: MediaType,
    poster?: string,
    position?: number;
    background?: string
    tmdbId?: number;
}

/**
 * useful for the grid: decade|search|genre page
 */
export interface SearchInterface {
    /**
     * total pages available
     */
    pages: number;
    data: MediaSection[];
}

export interface FramesCompany {
    name: string,
    logo: string,
    images: string[],
    movies: MediaSection[],
    shows: MediaSection[]
}

export default class Media extends Episode {

    /**
     * @param mediaId media to be processed
     * @param slim summarised processing / not
     * @param userId user to be processed
     * @returns media info for the display section
     */
    async getInfo(mediaId: number, userId: string, slim: boolean): Promise<MediaInfo | null> {
        let entry = await prisma.media.findUnique({where: {id: mediaId}});
        let database = await prisma.media.findMany({
            select: {
                background: true,
                poster: true,
                id: true,
                name: true,
                tmdbId: true,
                type: true
            }
        });

        await this.checkAndUpdate(entry);
        if (entry) {
            if (slim)
                return {...entry, type: entry.type};

            let dBase: any[] = [];
            let {cast, crew} = await castCrew(entry.tmdbId, entry.type);
            if (entry.collectionId) {
                let res = await getCollection(entry.collectionId);
                if (res) {
                    const parts = res.parts;
                    dBase = parts.sortKey('release_date', true).collapse(database, MediaType.MOVIE);
                    dBase = dBase.filter(item => item.tmdbId !== entry!.tmdbId);
                }
            }

            cast = cast.map((item: { character: any; name: any; id: any; }) => {
                return {
                    character: item.character,
                    name: item.name,
                    id: item.id
                }
            });

            crew = crew.map((item: { job: any; name: any; id: any; }) => {
                return {
                    job: item.job,
                    name: item.name,
                    id: item.id
                }
            });

            cast = entry.type === MediaType.MOVIE ? cast.slice(0, 15) : cast;
            crew = crew.filter((person: { job: string; }) => person.job === "Director" || person.job === "Screenplay");

            const {
                id,
                logo,
                backdrop,
                trailer,
                name,
                poster,
                overview,
                vote_average,
                runtime,
                type,
                genre,
                production,
                rating,
                release
            } = entry;

            let {
                section,
                recommendations
            } = await this.getRecommendation(entry.id, entry.tmdbId, database, entry.type);
            recommendations = dBase.concat(recommendations).uniqueID('id').map(e => {
                let {id, poster, name, type, background} = e;
                return {id, poster, name, type, background};
            });

            let seasonSectionData = await this.getSections(mediaId, userId);
            let obj: MediaInfo = {
                backdrop,
                cast,
                crew,
                genre,
                id,
                logo,
                name,
                section: [...section, ...['Details']],
                overview,
                poster,
                production,
                rating,
                recommendations: recommendations,
                release,
                review: vote_average,
                runtime,
                trailer,
                type,
            }

            if (seasonSectionData) {
                obj.section = obj.section ? [...seasonSectionData.section, ...obj.section] : seasonSectionData.section;
                let seasons = seasonSectionData.data;
                return {...obj, seasons}
            }

            return obj;
        } else return null;
    }

    /**
     * @param mediaId media to be processed
     * @param tmdbId for the media to be processed
     * @param database list of all media available
     * @param type type of media being processed
     * @returns the recommendations for a media element provided from TMDB
     */
    async getRecommendation(mediaId: number, tmdbId: number, database: MediaSection[], type: MediaType): Promise<{ section: string[], recommendations: any[] }> {
        let recommendations = await pageTwo(type, tmdbId, database, 1, 2, false);
        let section = recommendations.length ? ["More like this"] : ["Surprise me!"];
        let array = recommendations.length ? recommendations.filter(e => e.id !== mediaId) : database.randomiseDB(10, mediaId, type);
        return {section, recommendations: array};
    }

    /**
     * @returns gets the decades of media available on the database
     */
    async getDecades(): Promise<number[]> {
        let data = await prisma.media.findMany({select: {release: true}});
        return data.map(item => {
            return {
                year: parseInt(item.release.replace(/\w{3} /, ''))
            }
        }).filter(item => item.year % 10 === 0).uniqueID('year').sortKey('year', true).map(item => item.year);
    }

    /**
     * @desc searches for movies in a specific decade by pages of 100
     * @param decade
     * @param page
     */
    async getDecade(decade: number, page: number): Promise<SearchInterface> {
        let res = await prisma.media.findMany();
        let data: MediaSection[] = res.map(item => {
            return {
                type: item.type,
                id: item.id, logo: item.logo,
                backdrop: item.backdrop, name: item.name,
                year: parseInt(item.release.replace(/\w{3} /, ''))
            }
        }).filter(item => item.year >= decade && item.year < decade + 10).uniqueID('id');

        page = 100 * (page - 1);
        let pages = Math.floor(data.length / 100) + 1;
        data = data.length > page ? data.slice(page, page + 100) : [];
        return {data: data.sortKeys('year', 'name', true, true), pages};
    }

    /**
     * @returns the list of all the available genres on the database
     */
    async getGenres(): Promise<string[]> {
        let data = await prisma.media.findMany({select: {genre: true}});
        let string: string = data.map(item => item.genre).join(' ');
        return string.replace(/ &|,/g, '').split(' ').map((genre: string) => {
            return {genre};
        }).uniqueID('genre').filter(item => item.genre !== '').sortKey('genre', true).map(item => item.genre);
    }

    /**
     * @desc searches for a specific genre by pages of 100
     * @param genre
     * @param page
     */
    async getGenre(genre: string, page: number): Promise<SearchInterface> {
        let data: MediaSection[] = await prisma.media.findMany({
            where: {genre: {contains: genre}},
            select: {id: true, name: true, backdrop: true, logo: true, type: true}
        });

        if (data.length) {
            page = 100 * (page - 1);
            let pages = Math.floor(data.length / 100) + 1;
            data = data.length > page ? data.slice(page, page + 100) : [];
            return {data, pages}

        } else return {data: [], pages: 0}
    }

    /**
     * @Desc gets the library by pages
     * @param page
     * @param type
     * @returns Promise<SearchInterface> either the movie or show library in pages of 100 sorted by trending
     */
    async library(page: number, type: MediaType): Promise<SearchInterface> {
        let database = await prisma.media.findMany();
        let dbase = database.map(item => {
            return {
                id: item.id,
                type: item.type,
                tmdbId: item.tmdbId, logo: item.logo,
                backdrop: item.backdrop, name: item.name,
                year: parseInt(item.release.replace(/\w{3} /, ''))
            }
        }).filter(item => item.type === type);
        let data = await trending(3, dbase);
        dbase = dbase.sortKey('year', false);
        data = data.concat(dbase).uniqueID('tmdbId');

        page = 100 * (page - 1);
        let pages = Math.floor(data.length / 100) + 1;
        data = data.length > page ? data.slice(page, page + 100) : [];
        data = data.map(item => {
            delete item.popularity;
            delete item.tmdbId;
            delete item.year;
            return item;
        })
        return {data, pages}
    }

    /**
     * @desc returns the names of the most recent videos
     * @param mediaType
     */
    async libraryTrending(mediaType: MediaType): Promise<{ name: string, type: MediaType, id: number }[]> {
        let database = await prisma.media.findMany();
        let dbase = database.map(item => {
            return {
                id: item.id,
                type: item.type,
                tmdbId: item.tmdbId, logo: item.logo,
                backdrop: item.backdrop, name: item.name,
                year: parseInt(item.release.replace(/\w{3} /, ''))
            }
        }).filter(item => item.type === mediaType);
        let data = await trending(2, dbase);
        dbase = data.sortKey('year', false);
        return dbase.map(e => {
            return {
                name: e.name,
                type: e.type,
                id: e.id
            }
        }).slice(0, 12);
    }

    /**
     * @desc the next movie for playback for the current item being played if episode fails
     * @param videoId
     * @param userId user to be processed
     */
    async upNext(videoId: number, userId?: string,): Promise<DetailedEpisode | null> {
        let data = await super.upNext(videoId);
        if (data)
            return data;

        let video = await prisma.video.findUnique({where: {id: videoId}, include: {media: true}});
        if (video && video.media && video.media.type === MediaType.MOVIE) {
            let database = await prisma.media.findMany();
            if (video.media.collectionId) {
                let collection: any[] = await prisma.media.findMany({where: {collectionId: video.media.collectionId}});
                collection = collection.map(item => {
                    item.releaseDate = new Date(item.release);
                    return item;
                }).sortKey('releaseDate', true);

                let releaseDate = new Date(video.media.release);
                let index = collection.find(item => item.releaseDate > releaseDate);
                if (index) {
                    let {overview, name, backdrop, logo} = index;
                    let video = await prisma.video.findFirst({where: {mediaId: index.id}});
                    if (video)
                        return {overview, name, backdrop, logo, id: index.id, type: MediaType.MOVIE};
                }
            }

            let info = (await this.getRecommendation(video.mediaId, video.media.tmdbId, database, video.media.type)).recommendations;
            let pos = Math.floor(Math.random() * info.length);
            let index = info[pos];

            if (index.type === MediaType.MOVIE) {
                let {overview, name, backdrop, logo} = index;
                let video = await prisma.video.findFirst({where: {mediaId: index.id}});
                if (video)
                    return {overview, name, backdrop, logo, id: index.id, type: MediaType.MOVIE};
            }
        }
        return null;
    }

    /**
     * @desc handles the addition of items to the media table
     * @param obj
     * @param location
     */
    async addMedia(obj: UpdateInterface, location: string) {
        let res = null;
        const data = await getDetails(obj.type, obj.tmdbId);
        if (data) {
            const trailer = await getTrailer(obj.tmdbId, obj.type);
            const background: string = await aJax({
                method: "POST",
                url: 'https://frameshomebase.maix.ovh/api/out'
            }, {process: 'averageColor', image: obj.poster});

            if (obj.type === MediaType.MOVIE) {
                const {release, rating} = await getMovieRating(obj.tmdbId);
                let {overview, vote_average, runtime} = data;

                let hours = Math.floor(runtime / 60);
                let tempHours = hours !== 0 ? hours > 1 ? hours + " hours, " : hours + " hour, " : "";
                tempHours = tempHours + (runtime % 60) + " mins.";

                res = {
                    ...obj,
                    release, rating,
                    overview: overview || '',
                    vote_average: parseFloat(vote_average), runtime: tempHours,
                    genre: getGenre(data), trailer,
                    production: getProd(data),
                    collectionId: data.belongs_to_collection ? data.belongs_to_collection.id : null,
                }

            } else {
                let {overview, vote_average, first_air_date, episode_run_time} = data;
                let release = new Date(first_air_date).toUTCString().substr(8, 8);
                let genre = getGenre(data);
                let rating = await getTvRating(obj.tmdbId);
                let production = getProd(data);

                res = {
                    ...obj, trailer,
                    overview: overview || '', vote_average: parseFloat(vote_average),
                    release, rating, genre, production, runtime: episode_run_time[0] + ' mins.',
                    collectionId: null,
                }
            }

            if (res) {
                try {
                    const media = await prisma.media.upsert({
                        where: {tmdbId_type: {tmdbId: obj.tmdbId, type: obj.type}},
                        create: {
                            ...res,
                            background,
                            created: new Date(),
                            updated: new Date()
                        }, update: {...res, background}
                    });

                    const video = media.type === MediaType.MOVIE ? await prisma.video.upsert({
                        where: {location},
                        create: {english: null, french: null, german: null, location, mediaId: media.id},
                        update: {}
                    }) : await prisma.folder.upsert({
                        where: {location},
                        create: {location, showId: media.id},
                        update: {}
                    });

                    if (media.type === MediaType.MOVIE) {
                        await prisma.sub.create({data: {videoId: video.id}});
                        const videos = await prisma.video.findMany({where: {AND: [{mediaId: media.id}, {NOT: {location}}]}});
                        await prisma.video.deleteMany({where: {AND: [{mediaId: media.id}, {NOT: {location}}]}});

                        for await (let item of videos)
                            await drive.deleteFile(item.location);

                    } else
                        await prisma.folder.deleteMany({where: {AND: [{showId: media.id}, {NOT: {location}}]}});

                } catch (e) {
                    console.log(e);
                }
            }
        }
    }

    /**
     * @desc gets the recommendation of a specific item from tmdb [even items not in database]
     * @param tmdbId
     * @param type
     */
    async getOutsideRec(tmdbId: number, type: MediaType): Promise<FrontSearch[]> {
        let data: FrontSearch[] = [];
        let entry = await getDetails(type, tmdbId);
        let media = await prisma.media.findMany();
        if (entry) {
            data = [{
                drift: 0,
                popularity: entry.popularity,
                name: '' + (type === MediaType.MOVIE ? entry.title : entry.name),
                id: entry.id,
                type: type === MediaType.MOVIE ? 'movie' : 'show',
                overview: entry.overview || '',
                backdrop: 'https://image.tmdb.org/t/p/original' + entry.backdrop_path
            }]

            if (entry.belongs_to_collection) {
                let res = await getCollection(entry.belongs_to_collection.id);
                if (res && res.hasOwnProperty('parts')) {
                    let parts = res.parts;
                    data = parts.map(entry => {
                        return {
                            drift: 0,
                            popularity: entry.popularity,
                            name: '' + (type === 'MOVIE' ? entry.title : entry.name),
                            id: entry.id,
                            type: type === 'MOVIE' ? 'movie' : 'show',
                            overview: entry.overview || '',
                            backdrop: 'https://image.tmdb.org/t/p/original' + entry.backdrop_path
                        }
                    });
                }
            }


            let recommendations: tmdbMedia[] = await pageTwo(type, tmdbId, [], 1, 8, true);
            const temp: FrontSearch[] = recommendations.map(entry => {
                return {
                    drift: 0,
                    popularity: entry.popularity,
                    name: '' + (type === 'MOVIE' ? entry.title : entry.name),
                    id: entry.id,
                    type: type === MediaType.MOVIE ? 'movie' : 'show',
                    overview: entry.overview || '',
                    backdrop: 'https://image.tmdb.org/t/p/original' + entry.backdrop_path
                }
            })

            return data.concat(temp).map(e => {
                const type = e.type === 'movie' ? MediaType.MOVIE : MediaType.SHOW;
                const temp = media.find(i => i.type === type && i.tmdbId === e.id)
                e.present = temp !== undefined;
                if (temp)
                    e.libName = temp.name;
                e.recom = true;
                return e;
            }).filter(e => e.backdrop !== null && e.overview !== '');
        }

        return data;
    }

    /**
     * @desc gets the details of a person from tmdb including media they've stared in [if forDownload this media may include items not in the database]
     * @param id
     * @param forDownload determines if this is to be shown in manage or to be shown in the info page
     */
    async getPersonInfo(id: number, forDownload = false): Promise<FrontSearch[] | FramesPerson> {
        const media = await prisma.media.findMany({
            select: {
                id: true,
                name: true,
                poster: true,
                background: true,
                type: true,
                tmdbId: true
            }
        });
        if (forDownload) {
            const response: FrontSearch[] = await getPersonInfo(id, forDownload ? [] : media);
            return response.map(e => {
                const type = e.type === 'movie' ? MediaType.MOVIE : MediaType.SHOW;
                const temp = media.find(i => i.type === type && i.tmdbId === e.id)
                e.present = temp !== undefined;
                if (temp)
                    e.libName = temp.name;
                e.recom = true;
                return e;
            })
        } else {
            const response: FramesPerson = await getPersonInfo(id, forDownload ? [] : media);

            response.tv_cast = response.tv_cast.map(e => {
                delete e.tmdbId;
                return e;
            });

            response.movie_cast = response.movie_cast.map(e => {
                delete e.tmdbId;
                return e;
            });

            response.production = response.production.map(e => {
                delete e.tmdbId;
                return e;
            })

            return response;
        }
    }

    /**
     * @desc returns details on production company including media that they have taken part in its production
     * @param companyId
     */
    async getCompanyDetails(companyId: string): Promise<FramesCompany | null> {
        const media: MediaSection[] = await prisma.media.findMany({
            where: {
                production: {
                    path: '$[*].id',
                    array_contains: companyId
                }
            }, select: {
                name: true,
                id: true,
                type: true,
                poster: true,
                background: true,
            }, orderBy: [{
                vote_average: 'desc'
            }]
        })

        const company = await getProdCompany(companyId);
        if (company) {
            const movies = media.filter(e => e.type === MediaType.MOVIE).sortKey('name', true);
            const shows = media.filter(e => e.type === MediaType.SHOW).sortKey('name', true);
            const images = media.map(e => e.poster || '');

            return {
                name: company.name,
                logo: company.logo_path,
                movies, shows, images
            }
        }

        return null;
    }

    /**
     * @desc finds a production company from it's canonical name
     * @param name
     */
    async findCompanyByName(name: string) {
        let item = await prisma.media.findFirst({
            where: {
                production: {
                    path: '$[*].name',
                    array_contains: name
                }
            }, select: {production: true}
        }) as { production: { id: string, name: string }[] };

        const prod = item.production.find(e => e.name === name);
        if (prod)
            return await this.getCompanyDetails(prod.id);

        else return null;
    }

    /**
     * @desc finds a TMDB personality by their name
     * @param name
     */
    async findByName(name: string) {
        const people = (await findPerson(name)).map(e => {
            return {
                id: e.id, type: 'person',
                popularity: e.popularity, drift: e.diff, backdrop: e.image,
                overview: e.known_for, name: e.name
            }
        }).sortKey('drift', true);

        if (people.length)
            return await this.getPersonInfo(people[0].id) as FramesPerson;

        return null
    }

    /**
     * @desc gets the media to be modified
     * @param id
     */
    async getForEdit(id: number): Promise<EditMedia | null> {
        const media = await prisma.media.findUnique({where: {id}});
        if (media) {
            const {backdrop, logo, poster, name, id, type} = media;
            return {
                media: {backdrop, logo: logo!, poster, name, id, type}
            }
        }

        return null;
    }

    /**
     * @desc attempts to download new media using the magnet handler if configured
     */
    async findNewMedia() {
        let movieBase: any[] = [];
        let tvBase: any[] = [];
        const dbase = await prisma.media.findMany();
        const missing: tmdbMedia[] = await trending(4, dbase, true);
        for (let item of missing)
            if (item.title)
                await magnet.findMovie(item.id);
            else
                await magnet.findSeason(item.id, 1);

        for (let item of dbase)
            if (item.type === MediaType.MOVIE)
                movieBase.concat(await pageTwo(item.type, item.tmdbId, [], 1, 5, true)).uniqueID('id');
            else
                tvBase.concat(await pageTwo(item.type, item.tmdbId, [], 1, 5, true)).uniqueID('id');

        let movies = dbase.filter(e => e.type === MediaType.MOVIE).filterInFilter(movieBase, 'tmdbId', 'id');
        let shows = dbase.filter(e => e.type === MediaType.SHOW).filterInFilter(tvBase, 'tmdbId', 'id');

        const info = movies.concat(shows).sortKey('popularity', false);

        for (let item of info)
            if (item.title)
                await magnet.findMovie(item.id);
            else
                await magnet.findSeason(item.id, 1);
    }

    /**
     * @desc depending on frames config searches for episodes missing from the database and attempts to download them
     */
    async findNewEpisodes() {
        const shows = await prisma.media.findMany({where: {type: MediaType.SHOW}, orderBy: [{updated: 'desc'}]});

        for (let item of shows)
            await this.getNewEpisodes(item.id);
    }

    /**
     * @desc because tmdb info is being stored on the database this ensures that some critical information is always up to date
     * @param media
     */
    async checkAndUpdate(media: Med | null) {
        let time = new Date().getTime() - (1000 * 60 * 60 * 24 * 14);
        const twoWeeks = new Date(time);
        time = new Date().getTime() - (1000 * 60 * 60 * 24 * 730);
        const twoYears = new Date(time);

        if (media && ((twoWeeks > media.created && media.production === [] || media.vote_average === 0) || (twoYears > media.created && media.type === MediaType.MOVIE && media.collectionId === null))) {
            let location: string = '';
            const {name, type, tmdbId, logo, poster, backdrop} = media;
            const data: UpdateInterface = {
                name, type, tmdbId, logo, poster, backdrop
            }

            if (media.type === MediaType.MOVIE) {
                const video = await prisma.video.findFirst({where: {mediaId: media.id}});
                if (video)
                    location = video.location;

            } else {
                const folder = await prisma.folder.findFirst({where: {showId: media.id}});
                if (folder)
                    location = folder.location;

            }

            await this.addMedia(data, location);
        }
    }
}

