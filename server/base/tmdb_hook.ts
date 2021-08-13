import {aJax, get} from './baseFunctions';
import {MediaType} from '@prisma/client';
import environment from "./env"
import {MediaSection} from "../classes/media";
import {AppleIMages, FramesImages, UpdateImages} from "../classes/update";

export interface tmdbMedia {
    release_date: string;
    vote_average: string;
    runtime: number;
    id: number;
    belongs_to_collection: null | { id: number };
    overview: string | null;
    title?: string,
    name?: string;
    popularity: number;
    genres: { id: number, name: string }[]
    first_air_date: string;
    episode_run_time: string[];
    number_of_seasons: number;
    number_of_episodes: number;
    backdrop_path: string;
    networks?: { logo_path: string | null, id: number, name: string }[]
    production_companies: { logo_path: string | null, id: number, name: string }[]
}

export interface Collection {
    parts: tmdbMedia[]
}

export interface tmdbSeason {
    name: string;
    poster_path: string;
    season_number: number;
    episodes: tmdbEpisode[]
}

export interface tmdbEpisode {
    air_date: string;
    name: string | null;
    episode_number: number;
    still_path: string | null;
    overview: string | null;
}

export interface People {
    results?: Person[];
}

export interface Person {
    adult: boolean;
    gender: number;
    id: number;
    known_for: tmdbMedia[];
    known_for_department: string;
    name: string;
    popularity: number;
    profile_path: string
}

export interface Search {
    results?: Array<{
        id: number;
        title: string;
        drift?: number;
        name?: string;
        overview: string;
        popularity: number;
        backdrop_path: string | null;
        release_date: string;
        first_air_date: string;
    }>
}

export interface External {
    id: number,
    tvdb_id: number;
    imdb_id: string | null,
    facebook_id: string | null,
    instagram_id: string | null,
    twitter_id: string | null
}

export interface PeopleResponse {
    id: number;
    name: string;
    diff: number;
    popularity: number;
    image: string;
    known_for: string;
}

export interface tmdbPerson {
    id: number;
    title?: string,
    name?: string;
    job: string;
    popularity: number;
    backdrop_path: string;
    overview: string | null;
}

export interface FrontSearch {
    libName?: string;
    type: 'person' | 'movie' | 'show';
    overview: string;
    backdrop: string;
    id: number;
    popularity: number;
    drift: number;
    name: string;
    present?: boolean;
    recom?: boolean;
}

export interface FramesPerson {
    name: string;
    poster: string;
    biography: string;
    movie_cast: MediaSection[],
    movie_crew?: MediaSection[],
    tv_cast: MediaSection[],
    tv_crew?: MediaSection[],
    production: MediaSection[]
}

export interface TmdbImages {
    aspect_ratio: number,
    file_path: string,
    height: number,
    iso_639_1: null | string,
    vote_average: number,
    vote_count: number,
    width: number
}

export interface FanArtImage {
    id: string,
    url: string,
    lang: string,
    likes: string
}

export interface FanArtBulkImages {
    name: string;
    hdmovielogo?: FanArtImage[];
    hdtvlogo?: FanArtImage[];
    moviethumb?: FanArtImage[];
    tvthumb?: FanArtImage[];
    moviebackground?: FanArtImage[];
    showbackground?: FanArtImage[];
    hdclearart?: FanArtImage[];
    hdmovieclearart?: FanArtImage[];
    movieposter?: FanArtImage[];
    tvposter?: FanArtImage[];
}

export interface TmdbBulkImages {
    backdrops: TmdbImages[]
    posters: TmdbImages[]
    logos?: TmdbImages[]
}

export interface FrontImage {
    language: string | null;
    name: string;
    drift: number;
    likes: number;
    url: string;
}

interface tmdbCompany {
    description: string;
    headquarters: string;
    homepage: string;
    id: number,
    logo_path: string;
    name: string;
    origin_country: string;
    parent_company: number | null;
}

const {apiKey, base} = environment.credentials.tmdb_api;

/**
 * @desc returns the appropriate genre following a complex function
 * @param response
 */
const getGenre = (response: tmdbMedia): string => {
    let genre = response.genres.length > 1;
    let res: string = '';
    if (genre) {
        let gen1 = response.genres[0].name.includes("&");
        let gen2 = response.genres[1].name.includes("&");

        switch (true) {
            case (!gen1 && !gen2):
                res = response.genres[0].name + " & " + response.genres[1].name;
                break;
            case (gen1 && !gen2):
                res = response.genres[1].name + ", " + response.genres[0].name;
                break;
            case (!gen1 && gen2):
                res = response.genres[0].name + ", " + response.genres[1].name;
                break;
            case (gen1 && gen2):
                res = response.genres[0].name;
                break;
        }

    } else res = response.genres.length ? response.genres[0].name : 'Unknown';

    return res;
}

/**
 * @desc a more efficient and exhaustive method of getting the mpaa data and release date of films
 * @param results
 * @param locale
 * @returns {{mpaa: string, date: string}}
 */
const optimiseRating = (results: any[], locale: string) => {
    let holder: { release_dates: { certification: string, release_date: string }[] } | null = null;
    let mpaa = "";
    let date = '';

    for (const item of results) {
        if (item.iso_3166_1 === locale) {
            holder = item;
        }
    }

    if (holder) {
        for (const item of holder.release_dates) {
            mpaa = "Unknown";
            date = "Not Found";
            if (item.certification !== '') {
                mpaa = item.certification;
                date = item.release_date;
                break;
            }
        }
    }

    return {mpaa: mpaa, date: date};
}

/**
 * @desc gets relevant MPAA rating and release date of a movie from TMDB
 * @param tmdbId
 * @returns {Promise<{release: string, rating: (string|string)}>}
 */
const getMovieRating = async (tmdbId: number) => {
    let release = await get(base + "movie/" + tmdbId + "/release_dates?api_key=" + apiKey);

    const gnr = ["US", "GB", "FR"];
    let i = 0;
    let found = false;
    let mpaa: string = "";
    let date: string = "Not Found";
    if (release) {
        while (i < 3 && !found) {
            let res = optimiseRating(release.results, gnr[i]);
            mpaa = res.mpaa;
            date = res.date;
            i++;
            if (mpaa !== "" && mpaa !== "Unknown") found = true;
        }

        if (mpaa === "") {
            let res = optimiseRating(release.results, gnr[0]);
            mpaa = res.mpaa;
            date = res.date;
        }
    }

    date = date === "Not Found" ? date : new Date(date).toUTCString().substr(8, 8);
    return {release: date, rating: mpaa};
}

/**
 * @desc gets relevant MPAA rating and release date of a show from TMDB
 * @param tmdbId
 * @returns {Promise<string>}
 */
const getTvRating = async (tmdbId: number) => {
    let rate = await get(base + "tv/" + tmdbId + "/content_ratings?api_key=" + apiKey);

    let rating = "Unknown";
    if (rate)
        for (const item of rate.results) {
            if (item.iso_3166_1 === "US")
                rating = item.rating;
        }

    return rating;
}

/**
 * @desc gets the production company details for a specific entry using it's TMDB id
 * @param response
 * @returns {[]}
 */
const getProd = (response: tmdbMedia) => {
    let {networks, production_companies} = response;
    networks = networks === undefined ? [] : networks;

    let prods = [];

    for (const item of networks) {
        if (item.logo_path !== null) {
            let temp = {id: "s" + item.id, name: item.name};
            prods.push(temp);
        }
    }

    for (const item of production_companies) {
        if (item.logo_path !== null) {
            let temp = {id: "m" + item.id, name: item.name};
            prods.push(temp);
        }
    }

    return prods;
}

/**
 * @desc gets information about production/acting staff responsible for an item based on it's tmdbId
 * @param tmdbId
 * @param type
 * @returns {Promise<Headers|*|boolean>}
 */
const castCrew = async (tmdbId: number, type: MediaType): Promise<Headers | any | boolean> => {
    let res = type === MediaType.MOVIE ? 'movie/' : 'tv/';
    return await get(base + res + tmdbId + "/credits?api_key=" + apiKey + "&language=en-US");
}

/**
 * @desc recursive function that searches TMDB for recommendations based on id
 * @param type
 * @param id
 * @param database
 * @param startInt
 * @param endInt
 * @param ignore || optional
 * @returns {Promise<[]>}
 */
const pageTwo = async <S>(type: MediaType, id: number, database: S[], startInt: number, endInt: number, ignore?: boolean): Promise<S[]> => {
    let reaType = type;
    ignore = ignore || false;
    let string = type === MediaType.MOVIE ? 'movie/' : 'tv/';
    let recommendations = await get(base + string + id + "/recommendations?api_key=" + apiKey + "&language=en-US&page=" + startInt);
    let similar = await get(base + string + id + "/similar?api_key=" + apiKey + "&language=en-US&page=" + startInt);
    similar = similar ? similar.results : [];
    recommendations = recommendations ? recommendations.results : [];
    let merge = similar.concat(recommendations).uniqueID("id");
    let recArray = ignore ? merge : merge.collapse(database, reaType);
    return (startInt < endInt) ? recArray.concat(await pageTwo(reaType, id, database, startInt + 1, endInt, ignore)).uniqueID(ignore ? 'id' : 'tmdbId') : recArray;
}

/**
 * @desc gets all movies in the collection as present movie
 * @returns {Promise<Headers|*|boolean>}
 * @param collectionId
 */
const getCollection = async (collectionId: number): Promise<Collection | false> => {
    return await get(base + "collection/" + collectionId + "?api_key=" + apiKey + "&language=en-US");
}

/**
 * @desc gets the Episode information of a given episode, season and show
 * @param obj
 * @returns {Promise<{overview: *, found: boolean, name: (string|*), poster: string}|{overview: *, found: boolean, name: (string|*), poster: (string|string|*|string)}>}
 */
const getEpisode = async (obj: { tmdbId: number, seasonId: number, episode: number }): Promise<any> => {
    return await get(base + "tv/" + obj.tmdbId + "/season/" + obj.seasonId + "/episode/" + obj.episode + "?api_key=" + apiKey + "&language=en-US");
}

/**
 * @desc gets the Season information of a given show
 * @param obj
 * @returns {Promise<{overview: *, found: boolean, name: (string|*), poster: string}|{overview: *, found: boolean, name: (string|*), poster: (string|string|*|string)}>}
 */
const getSeasonInfo = async (obj: { tmdbId: number, seasonId: number }): Promise<tmdbSeason | false> => {
    return await get(base + "tv/" + obj.tmdbId + "/season/" + obj.seasonId + "?api_key=" + apiKey + "&language=en-US");
}

/**
 * @desc searches on TMDB for popular and trending items in the week present in the database
 * @param dBase the host database || optional
 * @param limit how many pages down should one go for trending
 * @param forDownload
 */
const trending = async (limit: number, dBase: any[], forDownload?: boolean): Promise<any[]> => {
    let movies: any, tv: any;

    let int = 1;
    let tvBase: any[] = [];
    let movieBase: any[] = [];

    do {
        let mFin = "&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=";
        movies = await get(base + "discover/movie?api_key=" + apiKey + mFin + int);
        let tFin = `&language=en-US&sort_by=popularity.desc&page=${int}&timezone=America%2FNew_York&include_null_first_air_dates=false`;
        tv = await get(base + "discover/tv?api_key=" + apiKey + tFin);

        if (tv)
            tvBase = tvBase.concat(tv.results);
        if (movies)
            movieBase = movieBase.concat(movies.results);

        int++;
    } while (int < limit);

    if (forDownload) {
        let movie = dBase.filter(e => e.type === MediaType.MOVIE).filterInFilter(movieBase, 'tmdbId', 'id');
        let show = dBase.filter(e => e.type === MediaType.SHOW).filterInFilter(tvBase, 'tmdbId', 'id');
        return movie.concat(show).sortKey('popularity', false);
    }

    return movieBase.collapse(dBase, MediaType.MOVIE, 'popularity').concat(tvBase.collapse(dBase, MediaType.SHOW, 'popularity')).uniqueID('tmdbId').sortKey('popularity', false);
}

/**
 * @desc returns the trending items of right now
 * @returns {Promise<{movies: (*|*[]|{}), tv: (*|*[]|{})}>}
 */
const slimTrending = async (): Promise<{ movies: (any | any[] | {}); tv: (any | any[] | {}); }> => {
    let movies = await get(base + "trending/movie/week?api_key=" + apiKey);
    let tv = await get(base + "trending/tv/week?api_key=" + apiKey);
    return {movies: movies.results, tv: tv.results};
}

/**
 * @desc gets details for a specific tmdb entry
 * @param type
 * @param tmdbId
 * @returns {Promise<Headers|*|boolean>}
 */
const getDetails = async (type: MediaType, tmdbId: number): Promise<tmdbMedia | false> => {
    let string = type === MediaType.MOVIE ? 'movie/' : 'tv/';
    return await get(base + string + tmdbId + "?api_key=" + apiKey + "&language=en-US");
}

/**
 * @desc gets the external id for an item based on it's tmdbId
 * @param tmdbId
 * @param type
 * @returns {Promise<Headers|*|boolean>}
 */
const getExternalId = async (tmdbId: number, type: MediaType): Promise<External | false> => {
    let string = type === MediaType.MOVIE ? 'movie/' : 'tv/';
    return await get(base + string + tmdbId + '/external_ids?api_key=' + apiKey);
}

/**
 * @desc searches TMDB for an entry
 * @param type
 * @param name
 * @returns {Promise<*>}
 */
const search = async (type: MediaType, name: string): Promise<Search|false> => {
    let search = type === MediaType.MOVIE ? 'search/movie?api_key=' : 'search/tv?api_key=';
    return await get(base + search + apiKey + '&language=en-US&page=1&query=' + name + '&include_adult=true');
}

/**
 * @desc gets the trailer for a TMDB entry using type to determine if movie or tv show
 * @param tmdbId
 * @param type
 * @returns {Promise<string>}
 */
const getTrailer = async (tmdbId: number, type: MediaType) => {
    let string = type === MediaType.MOVIE ? "movie/" : "tv/";
    let response: { results?: { key: string, type: string }[] } | false = await get(base + string + tmdbId + "/videos?api_key=" + apiKey + "&language=en-US");
    let result = '';
    if (typeof response !== "boolean" && response.results)
        for (const item of response.results) {
            if (item.type === "Trailer") {
                result = item.key;
                break;
            }
        }

    return result;
}

/**
 * @desc searches on TMDB for people that match the name searched
 * @param name
 */
const findPerson = async (name: string): Promise<PeopleResponse[]> => {
    let people: People | false  = await get(base + 'search/person?api_key=' + apiKey + '&language=en-US&query=' + name + '&page=1&include_adult=true');
    return people && people.results ? people.results.filter(item => item.profile_path !== null).map(item => {
        return {
            id: item.id,
            name: item.name + ': (' + item.known_for_department + ')',
            diff: item.name.Levenshtein(name),
            popularity: item.popularity,
            image: 'https://image.tmdb.org/t/p/original' + item.profile_path,
            known_for: item.known_for.map((entry, i) => `${entry.name ? entry.name : entry.title}${i === item.known_for.length - 2 ? ' and ' : ', '}`).join('').replace(/, $/, '.')
        }
    }).sortKeys('diff', 'popularity', true, false) : [];
}

/**
 * @desc searches tmdb for a given string
 * @param name
 */
const performSearch = async (name: string): Promise<FrontSearch[]> => {
    const movies = await search(MediaType.MOVIE, name);
    const shows = await search(MediaType.SHOW, name);
    let media: FrontSearch[] = [];

    const people: FrontSearch[] = (await findPerson(name)).map(e => {
        return {
            id: e.id, type: 'person',
            popularity: e.popularity, drift: e.diff, backdrop: e.image,
            overview: e.known_for, name: e.name
        }
    });

    if (movies && movies.results && shows && shows.results) {
        media = (movies.results).concat(shows.results).filter(e => e.backdrop_path !== null && e.overview !== '').map(e => {
            return {
                popularity: e.popularity, name: e.name ? e.name : e.title,
                drift: e.name ? e.name.Levenshtein(name) : e.title.Levenshtein(name),
                type: e.name ? 'show' : 'movie', id: e.id, overview: e.overview,
                backdrop: "https://image.tmdb.org/t/p/original" + e.backdrop_path
            }
        });
    }

    return people.concat(media).sortKeys('drift', 'popularity', true, false)
}

const getProdCompany = async (companyId: string) => {
    const confirm = companyId.charAt(0) === "s";
    const id = companyId.replace(/[ms]/, '');
    const url = base + (confirm ? "network" : "company") + "/" + id + "?api_key=" + apiKey;
    const company: tmdbCompany | false = await get(url);
    if (company) {
        company.logo_path = 'https://image.tmdb.org/t/p/original' + company.logo_path;
        return company;
    }

    return null;
}

const getPersonInfo = async (id: number, dBase: MediaSection[]): Promise<any> => {
    const {
        name,
        biography,
        profile_path
    } = await get(base + "person/" + id + "?api_key=" + apiKey + "&language=en-US");
    let movie: { cast: tmdbPerson[], crew: tmdbPerson[] } = await get(base + "person/" + id + "/movie_credits?api_key=" + apiKey + "&language=en-US");
    let tv = await get(base + "person/" + id + "/tv_credits?api_key=" + apiKey + "&language=en-US");

    let obj: FramesPerson = {
        name: name,
        biography: biography,
        poster: 'https://image.tmdb.org/t/p/original' + profile_path,
        movie_cast: [], movie_crew: [], tv_cast: [], tv_crew: [], production: []
    }

    if (dBase.length) {
        obj.movie_cast = movie.cast.collapse(dBase, MediaType.MOVIE, 'character').uniqueID('tmdbId');
        obj.movie_crew = movie.crew.collapse(dBase, MediaType.MOVIE).uniqueID('tmdbId');

        obj.tv_cast = tv.cast.collapse(dBase, MediaType.SHOW, 'character').uniqueID('tmdbId');
        obj.tv_crew = tv.crew.collapse(dBase, MediaType.SHOW).uniqueID('tmdbId');

        obj.production = obj.tv_crew!.concat(obj.movie_crew!).sortKey('tmdbId', true);
        delete obj.tv_crew;
        delete obj.movie_crew;
        return obj;

    } else {
        const data: tmdbPerson[] = movie.cast.concat(movie.crew).concat(tv.cast).concat(tv.crew).sortKey('popularity', false).filter(item => item.backdrop_path !== null)
        const response: FrontSearch[] = [];

        for (let item of data)
            response.push({
                type: item.name ? 'show' : 'movie',
                id: +item.id,
                overview: item.overview || '',
                popularity: item.popularity, drift: 0,
                name: '' + (item.name ? item.name : item.title),
                backdrop: 'https://image.tmdb.org/t/p/original' + item.backdrop_path,
            })

        return response.uniqueID('id');
    }
}

const getAllImages = async (type: MediaType, tmdbId: number, name: string): Promise<FramesImages> => {
    let posters: FrontImage[] = [];
    let backdrops: FrontImage[] = [];
    let logos: FrontImage[] = [];

    let string = type === MediaType.MOVIE ? 'movie/' : 'tv/';
    let tmdbData: TmdbBulkImages | false = await get(base + string + tmdbId + '/images?api_key=' + apiKey);

    const {apiKey: api, base: fanBase} = environment.credentials.fanArt;
    const external = await getExternalId(tmdbId, type);
    let imdbId = type === MediaType.MOVIE ? tmdbId : external ? external.tvdb_id : 1;

    string = (type === MediaType.MOVIE ? 'movies' : 'tv') + '/';
    let fanArt: FanArtBulkImages = await get(fanBase + string + imdbId + '?api_key=' + api);

    if (tmdbData) {
        backdrops = tmdbData.backdrops.filter(e => e.iso_639_1 === null).map(e => {
            return {
                name,
                language: null,
                likes: Math.floor(e.vote_count * e.vote_average),
                drift: 0, url: 'https://image.tmdb.org/t/p/original' + e.file_path
            }
        })

        posters = tmdbData.backdrops.filter(e => e.iso_639_1 !== null).map(e => {
            return {
                name,
                language: e.iso_639_1,
                likes: Math.floor(e.vote_count * e.vote_average),
                drift: 0, url: 'https://image.tmdb.org/t/p/original' + e.file_path
            }
        }).concat(tmdbData.posters.map(e => {
            return {
                name,
                language: e.iso_639_1,
                likes: Math.floor(e.vote_count * e.vote_average) - 2000,
                drift: 0, url: 'https://image.tmdb.org/t/p/original' + e.file_path
            }
        }));

        logos = tmdbData.logos?.map(e => {
            return {
                name,
                language: e.iso_639_1,
                likes: Math.floor(e.vote_count * e.vote_average),
                drift: 0, url: 'https://image.tmdb.org/t/p/original' + e.file_path
            }
        }) || [];
    }

    if (fanArt) {
        let temp = type === MediaType.MOVIE ? fanArt.hdmovielogo : fanArt.hdtvlogo;
        let temp2 = type === MediaType.MOVIE ? fanArt.hdmovieclearart : fanArt.hdclearart;
        let poster = type === MediaType.MOVIE ? fanArt.movieposter : fanArt.tvposter;

        logos = logos.concat(temp?.map(e => {
            return {
                language: e.lang,
                likes: +(e.likes),
                name: fanArt.name,
                url: e.url, drift: 0
            }
        }) || []);
        temp = type === MediaType.MOVIE ? fanArt.moviebackground : fanArt.showbackground;
        temp = temp || [];

        temp2 = temp2 || [];
        backdrops = backdrops.concat(temp.map(e => {
            return {
                language: e.lang,
                likes: +(e.likes),
                name: fanArt.name,
                url: e.url, drift: 0
            }
        }));

        temp = type === MediaType.MOVIE ? fanArt.moviethumb : fanArt.tvthumb;
        temp = temp || [];
        poster = poster || [];
        posters = posters.concat(temp.map(e => {
            return {
                language: e.lang,
                likes: +(e.likes),
                name: fanArt.name,
                url: e.url, drift: 0
            }
        })).concat(temp2.map(e => {
            return {
                language: e.lang,
                likes: +(e.likes) - 1000,
                name: fanArt.name,
                url: e.url, drift: 0
            }
        })).concat(poster.map(e => {
            return {
                language: e.lang,
                likes: +(e.likes) - 2000,
                name: fanArt.name,
                url: e.url, drift: 0
            }
        }));
    }

    return {logos, backdrops, posters}
}

const getFramesImage = async (type: MediaType, tmdbId: number, name: string): Promise<UpdateImages> => {
    const images = await getAllImages(type, tmdbId, name);
    let posters = images.posters.sortKey('likes', false);

    let temp = posters.filter(e => e.language === 'en');
    posters = temp.length ? temp : posters;

    let logos = images.logos.sortKey('likes', false);

    temp = logos.filter(e => e.language === 'en');
    logos = temp.length ? temp : logos;

    let backdrops = images.backdrops.sortKey('likes', false);

    return {
        name,
        poster: posters.length ? posters[0].url : '',
        logo: logos.length ? logos[0].url : '',
        backdrop: backdrops.length ? backdrops[0].url : '',
    }
}

const getAppleImages = async (type: MediaType, tmdbId: number, name: string): Promise<AppleIMages[]> => {
    let int = -1;
    let apple: AppleIMages[] = [];
    let storefront = [143441, 143444, 143442, 143443];

    while (apple.length < 1 && int < storefront.length - 1) {
        int++;
        let data = {query: name, storefront: storefront[int], locale: "en-US"};
        let url = 'https://itunesartwork.bendodson.com/url.php';
        url = (await aJax({method: "POST", url: url}, data)).url;
        const temp = url.split('search/incremental?');
        url = temp[0] + 'search/incremental?sf=' + storefront[int] + '&' + temp[1] + '&q=' + name;
        let info = await get(url);
        info = info.data && info.data.canvas && info.data.canvas.shelves ? info.data.canvas.shelves : false;
        if (info) {
            let movies, shows;
            movies = shows = [];
            for (const item of info)
                if (item.title === 'Movies')
                    movies = item.items;

                else if (item.title === 'TV Shows')
                    shows = item.items;

            apple = type === MediaType.MOVIE ? movies : shows;
        }
    }

    return apple;
}

export {
    getAllImages,
    getFramesImage,
    getAppleImages,
    performSearch,
    findPerson,
    getTvRating,
    getTrailer,
    getMovieRating,
    getGenre,
    getProd,
    getDetails,
    search,
    getExternalId,
    slimTrending,
    castCrew,
    pageTwo,
    getCollection,
    trending,
    getEpisode,
    getSeasonInfo,
    getPersonInfo,
    getProdCompany
}