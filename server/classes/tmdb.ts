import {RestAPI} from "./stringExt";
import {CastType, MediaType} from "@prisma/client";
import {tmdbToken} from "../lib/environment";

export enum CompType {
    COMPANY = 'COMPANY', NETWORK = 'NETWORK',
}

export interface ItunesSearchResult {
    resultCount: number;
    results: Array<{
        wrapperType: string;
        kind: string;
        artistId: number;
        collectionId: number;
        trackId: number;
        artistName: string;
        collectionName: Date;
        trackName: string;
        trackCensoredName: string;
        artistViewUrl: string;
        collectionViewUrl: string;
        trackViewUrl: string;
        previewUrl: string;
        artworkUrl30: string;
        artworkUrl60: string;
        artworkUrl100: string;
        collectionPrice: number;
        trackPrice: number;
        collectionHdPrice: number;
        trackHdPrice: number;
        releaseDate: Date;
        collectionExplicitness: string;
        trackExplicitness: string;
        discCount: number;
        discNumber: number;
        trackCount: number;
        trackNumber: number;
        trackTimeMillis: number;
        country: string;
        currency: string;
        primaryGenreName: string;
        contentAdvisoryRating: string;
        shortDescription: string;
        longDescription: string;
    }>;
}

export interface tmdbMedia {
    release_date: string;
    vote_average: number;
    runtime: number;
    id: number;
    belongs_to_collection: null | {
        id: number;
        name: string;
        poster_path: string;
        backdrop_path: string;
    };
    overview: string | null;
    title?: string,
    name?: string;
    imdb_id: string;
    popularity: number;
    genres: { id: number, name: string }[]
    first_air_date: string;
    episode_run_time: string[];
    number_of_seasons: number;
    number_of_episodes: number;
    backdrop_path: string;
    poster_path: string;
    release_dates: {
        results: Array<{
            iso_3166_1: string, release_dates: {
                certification: string, iso_639_1: string, note: string, release_date: string
            }[]
        }>
    }
    videos: {
        results: Array<{
            id: string, iso_639_1: string, iso_3166_1: string, key: string, name: string, site: string, size: number, type: string
        }>
    }
    external_ids: External
    credits: tmdbCredits;
    content_ratings: {
        results: Array<{
            iso_3166_1: string, rating: string
        }>
    }
    networks?: { logo_path: string | null, id: number, name: string }[]
    production_companies: { logo_path: string | null, id: number, name: string }[]
}

export interface tmdbCredits {
    cast: {
        character: string, credit_id: string, id: number, name: string, order: number, profile_path: string | null
    }[];
    crew: {
        credit_id: string, department: string, id: number, job: string, name: string, profile_path: string | null
    }[];
}

export interface Collection {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string;
    parts: tmdbMedia[];
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
    season_number: number;
}

interface AppleImage {
    height: number;
    width: number;
    url: string;
    joeColor?: string;

    [key: string]: string | number | undefined;
}

export interface AppleIMages {
    title: string;
    type: string;
    releaseDate: string;
    images: {
        coverArt16X9: AppleImage, fullColorContentLogo: AppleImage, singleColorContentLogo: AppleImage, previewFrame: AppleImage

        [key: string]: AppleImage;
    }
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

export interface External {
    id: number,
    tvdb_id: number;
    imdb_id: string | null,
    facebook_id: string | null,
    instagram_id: string | null,
    twitter_id: string | null
}

export interface FrontImage {
    language: string | null;
    source: 'APPLE' | 'TMDB' | 'X-ART';
    year: number | null;
    name: string;
    drift: number;
    likes: number;
    url: string;
}

export interface FrontImages {
    backdrops: FrontImage[];
    posters: FrontImage[];
    logos: FrontImage[];
}

export class TmdbApi extends RestAPI {
    private readonly apiKey: string;
    private readonly fanArtApiKey: string;
    private readonly fanArtBaseUrl: string;
    private readonly baseUrl: string;

    constructor(apiKey: string, fanArtApiKey: string) {
        super();
        this.apiKey = apiKey;
        this.fanArtApiKey = fanArtApiKey;
        this.baseUrl = 'https://api.themoviedb.org/3';
        this.fanArtBaseUrl = 'https://webservice.fanart.tv/v3';
    }

    /**
     * Get a details for a specific media
     * @param id - media to be fetched
     * @param type - type of media
     */
    public async getMedia(id: number, type: MediaType): Promise<tmdbMedia | null> {
        const bit = '/' + (type === MediaType.MOVIE ? 'movie' : 'tv') + '/';
        const url = this.baseUrl + bit + id;
        const params = {
            api_key: this.apiKey,
            language: 'en-US',
            append_to_response: 'external_ids,credits,images,videos,release_dates,content_ratings,keywords,episode_groups'
        }

        return await this.makeRequest<tmdbMedia>(url, params);
    }

    /**
     * @desc gets the external id for an item based on it's tmdbId
     * @param id - tmdbId of the item
     * @param type - type of the item
     */
    public async getExternalId(id: number, type: MediaType): Promise<External | null> {
        const bit = '/' + (type === MediaType.MOVIE ? 'movie' : 'tv') + '/';
        const url = this.baseUrl + bit + id + '/external_ids';
        const params = {
            api_key: this.apiKey, language: 'en-US',
        };

        return await this.makeRequest<External>(url, params);
    }

    /**
     * @desc gets relevant MPAA rating and release date of a movie from TMDB
     * @param id - tmdbId of the movie
     */
    public async getMovieCollection(id: number): Promise<Collection | null> {
        const url = this.baseUrl + '/collection/' + id;
        const params = {
            api_key: this.apiKey, language: 'en-US', append_to_response: 'videos'
        };

        return await this.makeRequest<Collection>(url, params);
    }

    /**
     * @desc gets the Episode information of a given episode, season and show
     * @param id - tmdbId of the show
     * @param season - season number
     * @param episode - episode number
     */
    public async getEpisode(id: number, season: number, episode: number): Promise<tmdbEpisode | null> {
        const url = this.baseUrl + '/tv/' + id + '/season/' + season + '/episode/' + episode;
        const params = {
            api_key: this.apiKey, language: 'en-US', append_to_response: 'videos'
        };

        return await this.makeRequest<tmdbEpisode>(url, params);
    }

    /**
     * @desc gets the Season information of a given show
     * @param id - tmdbId of the show
     * @param season - season number
     */
    public async getSeason(id: number, season: number): Promise<tmdbSeason | null> {
        const url = this.baseUrl + '/tv/' + id + '/season/' + season;
        const params = {
            api_key: this.apiKey, language: 'en-US', append_to_response: 'videos'
        };

        return await this.makeRequest<tmdbSeason>(url, params);
    }

    /**
     * @desc get recommendations for a given media
     * @param id - media to get recommendations for
     * @param type - type of media
     * @param page - page of recommendations
     */
    public async getRecommendations(id: number, type: MediaType, page = 1): Promise<tmdbMedia[]> {
        const bit = '/' + (type === MediaType.MOVIE ? 'movie' : 'tv') + '/';
        const url1 = this.baseUrl + bit + id + '/recommendations';
        const url2 = this.baseUrl + bit + id + '/similar';
        const params = {
            api_key: this.apiKey, language: 'en-US', page
        };

        const data1 = await this.makeRequest<{ results: tmdbMedia[] }>(url1, params);
        const data2 = await this.makeRequest<{ results: tmdbMedia[] }>(url2, params);
        const data = (data1?.results || []).concat(data2?.results || []);
        return this.uniqueId(data, 'id');
    }

    /**
     * @desc searches TMDB for an entry
     * @param type - type of media to search for
     * @param name - name of the media to search for
     */
    public async searchMedia(type: MediaType, name: string): Promise<tmdbMedia[]> {
        const url = this.baseUrl + '/search/' + (type === MediaType.MOVIE ? 'movie' : 'tv');
        const params = {
            api_key: this.apiKey, language: 'en-US', query: name, include_adult: true
        };

        const data = await this.makeRequest<{ results: tmdbMedia[] }>(url, params);
        return data?.results || [];
    }

    /**
     * @desc gets the popular media
     * @param type - type of media to get
     * @param page - page of results
     */
    public async getPopularMedia(type: MediaType, page = 1): Promise<tmdbMedia[]> {
        const bit = '/' + (type === MediaType.MOVIE ? 'movie' : 'tv') + '/';
        const url = this.baseUrl + bit + 'popular';
        const params = {
            api_key: this.apiKey, language: 'en-US', sort_by: 'vote_average.desc', page
        };

        const data = await this.makeRequest<{ results: tmdbMedia[] }>(url, params);
        return data?.results || [];
    }

    /**
     * @desc gets the trending media
     * @param type - type of media to get
     * @param page - page of results
     */
    public async getTrendingMedia(type: MediaType, page = 1): Promise<tmdbMedia[]> {
        const bit = '/' + (type === MediaType.MOVIE ? 'movie' : 'tv') + '/';
        const url1 = this.baseUrl + '/trending' + bit + 'day';
        const url2 = this.baseUrl + '/trending' + bit + 'week';
        const params = {
            api_key: this.apiKey, language: 'en-US', page
        };

        const data = await this.makeRequest<{ results: tmdbMedia[] }>(url1, params);
        const data2 = await this.makeRequest<{ results: tmdbMedia[] }>(url2, params);
        return this.uniqueId((data?.results || []).concat(data2?.results || []), 'id');
    }

    /**
     * @desc gets the top-rated media
     * @param type - type of media to get
     * @param page - page of results
     */
    public async getTopRatedMedia(type: MediaType, page = 1): Promise<tmdbMedia[]> {
        const bit = '/' + (type === MediaType.MOVIE ? 'movie' : 'tv') + '/';
        const url = this.baseUrl + bit + 'top_rated';
        const params = {
            api_key: this.apiKey, language: 'en-US', page
        };

        const data = await this.makeRequest<{ results: tmdbMedia[] }>(url, params);
        return data?.results || [];
    }

    /**
     * @desc gets the information of a production company from TMDB
     * @param id - id of the production company
     * @param type - type of media to get
     */
    public async getProductionCompany(id: number, type: CompType): Promise<tmdbCompany | null> {
        const bit = '/' + (type === CompType.COMPANY ? 'company' : 'network') + '/';
        const url = this.baseUrl + bit + id;
        const params = {
            api_key: this.apiKey, language: 'en-US'
        };

        return await this.makeRequest<tmdbCompany>(url, params);
    }

    /**
     * @desc gets the information of someone from TMDB
     * @param id - id of the person
     */
    public async getPerson(id: number): Promise<{ name: string, biography: string, profile_path: string } | null> {
        const url = this.baseUrl + '/person/' + id;
        const params = {
            api_key: this.apiKey,
            language: 'en-US',
            append_to_response: ['combined_credits', 'images', 'tagged_images', 'external_ids', 'movie_credits', 'tv_credits']
        };

        return await this.makeRequest<{ name: string, biography: string, profile_path: string }>(url, params);
    }

    /**
     * @desc searches on TMDB for people that match the name searched
     * @param name - name of the person to search for
     */
    public async searchPerson(name: string): Promise<Person[]> {
        const url = this.baseUrl + '/search/person';
        const params = {
            api_key: this.apiKey, language: 'en-US', query: name
        };

        const data = await this.makeRequest<{ results: Person[] }>(url, params);
        return data?.results || [];
    }

    /**
     * @desc gets the information of a person from TMDB
     * @param id - id of the movie
     */
    public async getBibliography(id: number) {
        const url1 = this.baseUrl + '/person/' + id + '/movie_credits';
        const url2 = this.baseUrl + '/person/' + id + '/tv_credits';
        const params = {
            api_key: this.apiKey, language: 'en-US'
        };

        const movies = await this.makeRequest<{ cast: tmdbMedia[], crew: (tmdbMedia & { job: string })[] }>(url1, params) || {
            cast: [],
            crew: []
        };
        const shows = await this.makeRequest<{ cast: tmdbMedia[], crew: (tmdbMedia & { job: string })[] }>(url2, params) || {
            cast: [],
            crew: []
        };

        return {movies, shows};
    }

    /**
     * @desc gets the information of a person from TMDB
     * @param id - id of the person
     */
    public async getPersonMedia(id: number) {
        const {movies: data1, shows: data2} = await this.getBibliography(id);
        const movies = this.uniqueId((data1.cast || []).concat(data1?.crew || []), 'id');
        const tv = this.uniqueId((data2.cast || []).concat(data2?.crew || []), 'id');
        return {movies, tv};
    }

    /**
     * @desc gets images for a specific media from TMDB
     * @param id - id of the media
     * @param type - type of media to get
     */
    public async getTMDBImages(id: number, type: MediaType): Promise<TmdbBulkImages | null> {
        const bit = '/' + (type === MediaType.MOVIE ? 'movie' : 'tv') + '/';
        const url = this.baseUrl + bit + id + '/images';
        const params = {
            api_key: this.apiKey
        }

        return await this.makeRequest<TmdbBulkImages>(url, params);
    }

    /**
     * @desc gets the images of a TMDB media from fanart.tv
     * @param id - id of the media
     * @param type - type of media to get
     */
    public async getFanArtImages(id: number, type: MediaType) {
        const bit = type === MediaType.MOVIE ? 'movies' : 'tv';
        const media = await this.getExternalId(id, type);
        const params = {
            api_key: this.fanArtApiKey
        };

        id = type === MediaType.SHOW && media ? media.tvdb_id : id;
        const url = this.fanArtBaseUrl + '/' + bit + '/' + id;
        return await this.makeRequest<FanArtBulkImages>(url, params);
    }

    /**
     * @desc gets the images of a TMDB media from Apple using the iTunes API using Ben Dodson's API
     * @param name - name of the media
     * @param type - type of media to get
     */
    public async getAppleImages(name: string, type: MediaType) {
        let int = -1;
        let apple: AppleIMages[] = [];
        let storefront = [143441, 143444, 143442, 143443];

        while (apple.length < 1 && int < storefront.length - 1) {
            int++;
            let data = {query: name, storefront: storefront[int], locale: "en-US"};
            let url = 'https://itunesartwork.bendodson.com/url.php';
            url = (await this.makeRequest<{ url: string }>(url, data, "POST"))?.url || '';
            const temp = url.split('search/incremental?');
            url = temp[0] + 'search/incremental?sf=' + storefront[int] + '&' + temp[1] + '&q=' + name;
            let info = await this.makeRequest<any>(url, null);
            info = info?.data && info.data.canvas && info.data.canvas.shelves ? info.data.canvas.shelves : false;
            if (info) {
                let movies, shows;
                movies = shows = [];
                for (const item of info) if (item.title === 'Movies') movies = item.items;

                else if (item.title === 'TV Shows') shows = item.items;

                apple = type === "MOVIE" ? movies : shows;
            }
        }

        return apple;
    }

}

export class Aggregate extends TmdbApi {

    constructor(token: tmdbToken) {
        super(token.apiKey, token.fanArtApiKey);
    }

    /**
     * @desc gets the apple images for a TMDB entry using it's TMDB id
     * @param image - image to get
     * @param key - key to use
     */
    private static convertAppleToString(image: AppleImage, key: string) {
        let format = '.' + (key === 'logo' ? 'png' : 'jpg');
        let matches = image.url.match(/(?<link>.+?)(?=\/{w})/);
        if (matches && matches.groups) return matches.groups.link + '/' + image.width + 'x' + image.height + format;

        return null;
    }

    /**
     * @desc gets the iso_3166_1 certification of a TMDB media
     * @param media - media to get the certification from
     * @param type - type of media to get
     */
    public getRating(media: tmdbMedia, type: MediaType): { rating: string, release: Date | null } {
        const iso_3166_1 = ['US', 'GB', 'DE', 'FR'];
        let rate = 'unrated';
        let release = null;

        if (type === MediaType.MOVIE && media.release_dates && media.release_dates.results.length) {
            let dates = media.release_dates.results.filter(date => iso_3166_1.includes(date.iso_3166_1));
            dates = dates.sort((a, b) => a.iso_3166_1 < b.iso_3166_1 ? 1 : -1);

            while (dates.length && rate === 'unrated') {
                const date = dates.shift();
                if (date?.release_dates) {
                    const release_date = date.release_dates.find(x => x.certification !== '');
                    if (release_date) {
                        release = new Date(release_date.release_date);
                        rate = release_date.certification;
                    }
                }
            }
        }

        if (type === MediaType.SHOW && media.content_ratings) {
            const rating = media.content_ratings.results.find((date) => iso_3166_1.includes(date.iso_3166_1));
            release = new Date(media.first_air_date);
            if (rating)
                rate = rating.rating;
        }

        return {rating: rate, release};
    }

    /**
     * @desc returns the appropriate genre following a complex function
     * @param media - TMDB media
     */
    public getGenre(media: tmdbMedia): string {
        const genre = media.genres.length > 1;
        let res: string = 'Unknown';
        if (genre) {
            const gen1 = media.genres[0].name.includes("&");
            const gen2 = media.genres[1].name.includes("&");
            switch (true) {
                case (!gen1 && !gen2):
                    res = media.genres[0].name + " & " + media.genres[1].name;
                    break;
                case (gen1 && !gen2):
                    res = media.genres[1].name + ", " + media.genres[0].name;
                    break;
                case (!gen1 && gen2):
                    res = media.genres[0].name + ", " + media.genres[1].name;
                    break;
                case (gen1 && gen2):
                    res = media.genres[0].name;
                    break;
            }

        } else res = media.genres.length ? media.genres[0].name : 'Unknown';

        return res;
    }

    /**
     * @desc gets the production company details for a specific entry using it's TMDB id
     * @param media - media to get the production company from
     */
    public getProd(media: tmdbMedia): Array<{ id: string, name: string }> {
        let {networks, production_companies} = media;
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
     * @desc gets the trailer for a TMDB entry using it's TMDB id
     * @param media - media to get the trailer from
     */
    public getTrailer(media: tmdbMedia): string {
        const videos = media.videos.results;
        const trailers = videos.filter((video) => video.type === 'Trailer');
        return trailers.length > 0 ? trailers[0].key : '';
    }

    /**
     * @desc gets the cast for a TMDB entry using it's TMDB id
     * @param media - media to get the cast from
     */
    public getCast(media: tmdbMedia) {
        const credits = media.credits;
        const cast = credits.cast;
        const casts: { job?: string, character?: string, name: string, tmdbId: number, type: CastType }[] = cast.map((cast) => {
            return {
                type: CastType.ACTOR, character: cast.character, name: cast.name, tmdbId: cast.id
            };
        }).slice(0, 16);

        let crew: { job?: string, character?: string, name: string, tmdbId: number, type: CastType }[] = credits.crew.map((crew) => {
            return {
                type: crew.job === 'Director' ? CastType.DIRECTOR : /^Writer|Story|Screenplay$/i.test(crew.job) ? CastType.WRITER : CastType.PRODUCER,
                job: crew.job, name: crew.name, tmdbId: crew.id
            };
        });


        crew = this.uniqueId(crew.filter(crew => !(crew.type === CastType.PRODUCER && crew.job !== 'Executive Producer')), ['name', 'type']);
        return casts.concat(crew);
    }

    /**
     * @desc gets the images of a TMDB media from Apple using the iTunes API using Ben Dodson's API
     * @param media - media to get the images from
     * @param type - type of the media
     */
    public async processAppleData(media: string, type: MediaType) {
        let posters: FrontImage[] = [];
        let backdrops: FrontImage[] = [];
        let logos: FrontImage[] = [];
        const url = 'https://itunes.apple.com/search';
        const params = {
            term: media,
            media: type === MediaType.MOVIE ? 'movie' : 'tvShow',
        }

        const data = await this.makeRequest<ItunesSearchResult>(url, params);
        const results = this.sortArray(data?.results || [], 'releaseDate', 'asc');
        const apple = await this.getAppleImages(media, type);
        for (const item of apple) {
            const name = item.title;
            const drift = item.title.Levenshtein(media);
            const likes = Math.ceil(200 / (drift === 0 ? 1 : drift));
            const language = 'en';
            const entry = results.find(result => result.artistName === name);
            const year = new Date(item.releaseDate || entry?.releaseDate || '').getFullYear();
            let posterTemp: FrontImage | null = null;
            let backdropTemp: FrontImage | null = null;
            let logoTemp: FrontImage | null = null;
            const source = 'APPLE';

            const images = item.images;
            const poster = images.coverArt16X9 || null;
            const logo = images.fullColorContentLogo ? images.fullColorContentLogo : images.singleColorContentLogo || null;
            const background = images.previewFrame || null;

            if (poster) {
                const url = Aggregate.convertAppleToString(poster, 'poster');
                if (url) posterTemp = {
                    url, likes, language, year, name, drift, source
                };
            }

            if (logo) {
                const url = Aggregate.convertAppleToString(logo, 'logo');
                if (url) logoTemp = {
                    url, likes, language, year, name, drift, source
                };
            }

            if (background) {
                const url = Aggregate.convertAppleToString(background, 'backdrop');
                if (url) backdropTemp = {
                    url, likes, language, year, name, drift, source
                };
            }

            if (posterTemp) posters.push(posterTemp);

            if (logoTemp) logos.push(logoTemp);

            if (backdropTemp) backdrops.push(backdropTemp);

        }

        posters = posters.filter(poster => !isNaN(poster.year || NaN));
        logos = logos.filter(logo => !isNaN(logo.year || NaN));
        backdrops = backdrops.filter(backdrop => !isNaN(backdrop.year || NaN));
        return {posters, logos, backdrops};
    }

    /**
     * @desc gets all the episodes for a TV show from TMDB
     * @param id - TMDB id of the TV show
     */
    public async getAllEpisodes(id: number) {
        const show = await this.getMedia(id, MediaType.SHOW);

        if (!show) return {episodes: [], tmdbId: id};

        let season = 1;
        const episodes: { seasonId: number, season: tmdbEpisode[] }[] = [];

        do {
            const data = await this.getSeason(id, season);
            if (data) {
                episodes.push({seasonId: season, season: data.episodes});
                season++;
            }
        } while (season <= show.number_of_seasons);

        return {episodes, tmdbId: id};
    }

    /**
     * @desc Aggregates the images a TMDB entry from all sources
     * @param id - the TMDB id of the entry
     * @param name - the name of the entry
     * @param type - the type of the entry
     * @param year - the year of the entry
     */
    public async getImages(id: number, name: string, type: MediaType, year: number): Promise<FrontImages> {
        const tmdbData = await this.getTMDBImages(id, type);
        const fanArt = await this.getFanArtImages(id, type);

        let posters: FrontImage[];
        let backdrops: FrontImage[];
        let logos: FrontImage[];

        backdrops = (tmdbData?.backdrops || []).filter(e => e.iso_639_1 === null).map(e => {
            return {
                name,
                year,
                language: null,
                source: 'TMDB',
                likes: Math.floor(e.vote_count * e.vote_average),
                drift: 0,
                url: 'https://image.tmdb.org/t/p/original' + e.file_path
            }
        })

        posters = (tmdbData?.backdrops || []).filter(e => e.iso_639_1 !== null).map(e => {
            return {
                name,
                year,
                language: e.iso_639_1,
                source: 'TMDB',
                likes: Math.floor(e.vote_count * e.vote_average),
                drift: 0,
                url: 'https://image.tmdb.org/t/p/original' + e.file_path
            }
        });

        posters = posters.concat((tmdbData?.posters || []).map(e => {
            return {
                name,
                year,
                language: e.iso_639_1,
                source: 'TMDB',
                likes: Math.floor(e.vote_count * e.vote_average) - 2000,
                drift: 0,
                url: 'https://image.tmdb.org/t/p/original' + e.file_path
            }
        }));

        logos = tmdbData?.logos?.map(e => {
            return {
                name,
                year,
                language: e.iso_639_1,
                source: 'TMDB',
                likes: Math.floor(e.vote_count * e.vote_average),
                drift: 0,
                url: 'https://image.tmdb.org/t/p/original' + e.file_path
            }
        }) || [];

        let temp = fanArt ? type === MediaType.MOVIE ? fanArt.hdmovielogo : fanArt.hdtvlogo : [];
        let temp2 = fanArt ? type === MediaType.MOVIE ? fanArt.hdmovieclearart : fanArt.hdclearart : [];
        let poster = fanArt ? type === MediaType.MOVIE ? fanArt.movieposter : fanArt.tvposter : [];

        logos = logos.concat(temp?.map(e => {
            return {
                language: e.lang,
                year,
                likes: +(e.likes),
                source: 'X-ART',
                name: fanArt ? fanArt.name : '',
                url: e.url,
                drift: 0
            }
        }) || []);
        temp = fanArt ? type === MediaType.MOVIE ? fanArt.moviebackground : fanArt.showbackground : [];
        temp = temp || [];

        temp2 = temp2 || [];
        backdrops = backdrops.concat(temp.map(e => {
            return {
                language: e.lang,
                year,
                likes: +(e.likes),
                source: 'X-ART',
                name: fanArt ? fanArt.name : '',
                url: e.url,
                drift: 0
            }
        }));

        temp = fanArt ? type === MediaType.MOVIE ? fanArt.moviethumb : fanArt.tvthumb : [];
        temp = temp || [];
        poster = poster || [];
        posters = posters.concat(temp.map(e => {
            return {
                language: e.lang,
                year,
                likes: +(e.likes),
                source: 'X-ART',
                name: fanArt ? fanArt.name : '',
                url: e.url,
                drift: 0
            }
        })).concat(temp2.map(e => {
            return {
                language: e.lang,
                year,
                likes: +(e.likes) - 1000,
                source: 'X-ART',
                name: fanArt ? fanArt.name : '',
                url: e.url,
                drift: 0
            }
        })).concat(poster.map(e => {
            return {
                language: e.lang,
                year,
                likes: +(e.likes) - 2000,
                source: 'X-ART',
                name: fanArt ? fanArt.name : '',
                url: e.url,
                drift: 0
            }
        }));

        const apple = await this.processAppleData(name, type);
        if (apple) {
            backdrops = backdrops.concat(apple.backdrops);
            posters = posters.concat(apple.posters);
            logos = logos.concat(apple.logos);
        }

        posters = posters.filter(item => (year - 1 <= item.year! && item.year! <= year + 1) && item.drift < 3);
        backdrops = backdrops.filter(item => (year - 1 <= item.year! && item.year! <= year + 1) && item.drift < 3);
        logos = logos.filter(item => (year - 1 <= item.year! && item.year! <= year + 1) && item.drift < 3);

        posters = posters.map(item => {
            item.url = item.url.replace('http://', 'https://');
            return item;
        });
        backdrops = backdrops.map(item => {
            item.url = item.url.replace('http://', 'https://');
            return item;
        });
        logos = logos.map(item => {
            item.url = item.url.replace('http://', 'https://');
            return item;
        });

        logos = this.normalise(logos, 'likes');
        backdrops = this.normalise(backdrops, 'likes');
        posters = this.normalise(posters, 'likes');

        return {
            backdrops: this.sortArray(backdrops, ['drift', 'likes', 'source'], ['asc', 'desc', 'asc']),
            posters: this.sortArray(posters, ['drift', 'likes', 'source'], ['asc', 'desc', 'asc']),
            logos: this.sortArray(logos, ['drift', 'likes', 'source'], ['asc', 'desc', 'asc'])
        }
    }

    /**
     * @desc Processes the data from the apple api
     * @param id - The id of the movie or show
     * @param name - The name of the movie or show
     * @param type - The type of the movie or show (MOVIE or SHOW)
     * @param year -The year of the movie or show
     */
    public async getImagesForAutoScan(id: number, name: string, type: MediaType, year: number) {
        const images = await this.getImages(id, name, type, year);
        let backdrops = images.backdrops;
        let posters = images.posters;
        let logos = images.logos;

        let temp = posters.filter(e => e.language === 'en' && e.drift < 3);
        posters = temp.length ? temp : posters;

        temp = logos.filter(e => e.language === 'en' && e.drift < 3);
        logos = temp.length ? temp : logos;

        temp = backdrops.filter(e => e.drift < 3);
        backdrops = temp.length ? temp : backdrops;

        let poster = posters.length ? posters[0] : null;
        let logo = logos.length ? logos[0] : null;
        let backdrop = backdrops.length ? backdrops[0] : null;

        poster = poster && poster.drift < 3 ? poster : null;
        logo = logo && logo.drift < 3 ? logo : null;
        backdrop = backdrop && backdrop.drift < 3 ? backdrop : null;

        return {
            poster: poster?.url || '',
            logo: logo?.url || null,
            backdrop: backdrop?.url || ''
        }
    }

    /**
     * @desc get recommendations for a given media
     * @param id - media to get recommendations for
     * @param type - type of media
     * @param pages - number of pages of recommendations to get
     */
    public async getRecommendations(id: number, type: MediaType, pages = 1): Promise<tmdbMedia[]> {
        let data: tmdbMedia[] = [];
        let page = 1;

        do {
            const temp = await super.getRecommendations(id, type, page);
            data = data.concat(temp);
            page++;
        } while (page < pages);

        return data;
    }

    /**
     * @desc gets the trending media
     * @param pages - number of pages of trending media to get
     * @param type - type of media get trending media for
     */
    public async getTrendingMedia(type: MediaType, pages: number) {
        let data: tmdbMedia[] = [];
        let page = 1;

        do {
            const temp = await super.getTrendingMedia(type, page);
            data = data.concat(temp);
            page++;
        } while (page < pages);

        return this.uniqueId(data, 'id');
    }

    /**
     * @desc gets the top-rated media
     * @param pages - number of pages of trending media to get
     * @param type - type of media get trending media for
     */
    public async getTopRatedMedia(type: MediaType, pages: number) {
        let data: tmdbMedia[] = [];
        let page = 1;

        do {
            const temp = await super.getTopRatedMedia(type, page);
            data = data.concat(temp);
            page++;
        } while (page < pages);

        return this.uniqueId(data, 'id');
    }

    /**
     * @desc gets the popular media
     * @param pages - number of pages of trending media to get
     * @param type - type of media get trending media for
     */
    public async getPopularMedia(type: MediaType, pages: number) {
        let data: tmdbMedia[] = [];
        let page = 1;

        do {
            const temp = await super.getPopularMedia(type, page);
            data = data.concat(temp);
            page++;
        } while (page < pages);

        return this.uniqueId(data, 'id');
    }

    /**
     * @desc gets the trending media
     * @param pages - number of pages of trending media to get
     */
    public async getTrending(pages: number) {
        let moviesData = await this.getTrendingMedia(MediaType.MOVIE, pages);
        let showsData = await this.getTrendingMedia(MediaType.SHOW, pages);

        return {
            movies: moviesData,
            shows: showsData
        }
    }

    /**
     * @desc gets the top-rated media
     * @param pages - number of pages of trending media to get
     */
    public async getTopRated(pages: number) {
        let moviesData = await this.getTopRatedMedia(MediaType.MOVIE, pages);
        let showsData = await this.getTopRatedMedia(MediaType.SHOW, pages);

        return {
            movies: moviesData,
            shows: showsData
        }
    }

    /**
     * @desc gets the popular media
     * @param pages - number of pages of trending media to get
     */
    public async getPopular(pages: number) {
        let moviesData = await this.getPopularMedia(MediaType.MOVIE, pages);
        let showsData = await this.getPopularMedia(MediaType.SHOW, pages);

        return {
            movies: moviesData,
            shows: showsData
        }
    }

    /**
     * @desc searches the tmdb api for a given person
     * @param name - name of the person to search for
     */
    public async findPerson(name: string) {
        const people = await this.searchPerson(name);
        const response = this.sortArray(people.map(e => {
            return {
                id: e.id,
                type: 'person',
                popularity: e.popularity,
                drift: e.name.Levenshtein(name),
                backdrop: 'https://image.tmdb.org/t/p/original' + e.profile_path,
                overview: e.known_for,
                name: e.name
            }
        }), 'drift', 'asc');

        if (response.length > 0)
            return await this.getPerson(response[0].id);

        return null;
    }
}