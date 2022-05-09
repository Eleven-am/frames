import {createClient, SupabaseClient} from '@supabase/supabase-js';
import cookie from "cookie";
import {Aggregate} from "./tmdb";
import {NextRequest} from "next/server";
import {NextApiResponse} from "next";
import {Download, Episode, Frame, Media, Role, Room, Video, View} from "@prisma/client";
import {Modify} from "./scanner";
import {RestAPI} from "./stringExt";
import {MiddleWareInterface} from "../lib/environment";

export interface AuthCP {
    cpRight: string;
    aReserved: string;
    authentication: boolean;
}

interface MiddlewareOauth {
    client_id: string;
    client_secret: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface CookiePayload {
    session: string;
    context: Role;
    validUntil: number;
    email: string;
    notificationChannel: string;
}

const SECRET = process.env.SECRET || '';
const MIDDLEWARE = process.env.MIDDLEWARE || '';

export default class Middleware extends Aggregate {
    private oauth: MiddlewareOauth;
    private cache: Map<string, any>;
    private readonly realtimeApiKey: string;
    private readonly realtimeNotification: string;
    public readonly cypher: string;
    public readonly secret: string;
    private readonly supabase: SupabaseClient;

    constructor() {
        const config = Middleware.readMiddleWareEnv();
        super({apiKey: config.externalApis.tmdbApiKey, fanArtApiKey: config.externalApis.fanArtApiKey, realTimeApiKey: config.externalApis.realTimeApiKey});
        this.cache = new Map();
        this.realtimeNotification = config.globalNotification;
        this.realtimeApiKey = config.externalApis.realTimeApiKey;
        this.cypher = config.cypher;
        this.secret = config.secret;
        this.supabase = createClient(
            config.externalApis.supabase.supabaseEndpoint,
            config.externalApis.supabase.supabasePublicKey
        )

        this.oauth = {
            client_id: config.client_id,
            client_secret: config.client_secret,
            accessToken: config.accessToken,
            refreshToken: config.refresh_token,
            expiresIn: config.expiry_date
        };
    }

    /**
     * @desc converts a url inta format readable by frames
     * @param value - url to be converted
     */
    public convertUrl(value: string) {
        value = value.replace(/\+/g, ' ').replace(/\?.*clid[^"]+/, "");
        value = value.replace(/\s{3}/, ' + ');
        value = value.replace(/\s$/, '+');
        value = value.replace(/!!/g, '/');
        return value;
    }

    /**
     * @desc confirms if a user is logged in or not by checking the cookie
     * @param cookies - cookies sent by the client
     * @param key - key to check
     */
    public async confirmContent<S>(cookies: { [p: string]: string}, key: string) {
        const token = cookies[key];

        if (token) {
            const decrypted = await this.decrypt<S>(this.secret, token);
            if (decrypted)
                return decrypted;
        }

        return null;
    }

    /**
     * @desc contacts HomeBase
     */
    public async getAuthCpRight() {
        const url = 'https://frameshomebase.maix.ovh/api/oauth';
        const params = {type: 'authenticate', state: this.cypher};
        const response = await this.makeRequest<AuthCP>(url, params);
        if (response)
            return response;

        return {
            cpRight: 'Copyright © 2021 Roy Ossai.',
            aReserved: 'All rights reserved. No document may be reproduced for commercial use without written approval from the author.',
            authentication: true
        }
    }

    /**
     * @desc creates the SEO data for the page
     * @param type - type of the page
     * @param value - value of the page
     */
    public async getMetaTags(type: string, value: string) {
        if (type === 'movie' || type === 'show') {
            const {data} = await this.supabase
                .from<Modify<Media, {release: string}>>('Media')
                .select('*')
                .eq('type', type.toUpperCase())
                .ilike('name', `*${value}*`)

            if (data) {
                const response = data.map(item => {
                    const year = new Date(item.release).getFullYear();
                    const drift = item.name.Levenshtein(value);
                    return {...item, year, drift};
                })

                const info = this.sortArray(response, ['drift', 'year'], ['asc', 'desc'])[0];
                if (info)
                    return {
                        overview: info.overview,
                        name: info.name,
                        poster: info.poster
                    }
            }
        }

        if (type === 'watch' || type === 'frame' || type === 'room') {
            if (type === 'room') {
                const {data} = await this.supabase
                    .from<Room>('Room')
                    .select('*')
                    .eq('roomKey', value)
                    .single();

                value = data ? data.auth: value;
            }

            if (type === 'frame') {
                const {data} = await this.supabase
                    .from<Frame>('Frame')
                    .select('*')
                    .eq('cypher', value)
                    .single();

                value = data ? data.auth: value;
            }

            const {data} = await this.supabase
                .from<(View & {episode: Episode | null, video: (Video & {media: Media})})>('View')
                .select('*, episode:Episode(*), video:Video(*, media:Media!Video_mediaId_fkey(*))')
                .eq('auth', value)
                .single();

            if (data) {
                const {episode, video} = data;
                let {name, overview, poster, tmdbId} = video.media;

                if (episode) {
                    const episodeInfo = await this.getEpisode(tmdbId, episode.seasonId, episode.episode);
                    name = /^Episode \d+/i.test(episodeInfo?.name || 'Episode') ? `${name}: S${episode.seasonId}, E${episode.episode}` : `S${episode.seasonId}, E${episode.episode}: ${episodeInfo?.name}`;
                    overview = episodeInfo?.overview || overview;
                }

                return {
                    overview,
                    name,
                    poster
                }
            }
        }

        if (type === 'person') {
            const person = await this.findPerson(value);
            if (person)
                return {
                    overview: `See all media produced by ${person.name} available on Frames`,
                    name: person.name,
                    poster: 'https://image.tmdb.org/t/p/original' + person.profile_path
                }
        }

        /*if (type === 'collection') {
            const {data} = await this.supabase
                .from('Media')
                .select('name, poster, overview, cName:collection->>name')
                .ilike('cName', `*${value}*`)
                .single();

            console.log(data);
        }*/

        return {
            overview: 'Frames is a streaming service that offers a wide variety of TV shows, movies, anime, documentaries, and more on thousands straight to your browser',
            name: 'Frames - Watch FREE TV Shows and Movies Online',
            poster: '/meta.png'
        }
    }

    /**
     * @desc creates a html header tag for SEO
     * @param pathname
     */
    public async createHTML (pathname: string) {
        let type: string;
        let value: string;
        let name: string, overview: string, poster: string, link: string;
        overview = 'Frames is a streaming service that offers a wide variety of TV shows, movies, anime, documentaries, and more on thousands straight to your browser';
        name = 'Frames - Watch FREE TV Shows and Movies Online';
        poster = '/meta.png';
        link = this.convertUrl(pathname);
        pathname = link.replace('/', '');
        let object = pathname.split(/=/);

        if (object.length === 2) {
            type = object[0];
            value = object[1];

            const meta = await this.getMetaTags(type, value);
            if (meta) {
                name = meta.name;
                overview = meta.overview;
                poster = meta.poster;
            }
        }

        return `<!DOCTYPE html>
            <head>
                <meta name="viewport" content="width=device-width">
                <meta charset="utf-8">
                <link rel="apple-touch-icon" sizes="180x180" href="favicons/apple-touch-icon.png">
                <link rel="icon" type="image/png" sizes="32x32" href="favicons/favicon-32x32.png">
                <link rel="icon" type="image/png" sizes="16x16" href="favicons/favicon-16x16.png">
                <link rel="manifest" href="favicons/site.webmanifest">
                <link rel="shortcut icon" href="/favicon.ico">
                <meta name="msapplication-TileColor" content="#da532c">
                <meta name="msapplication-config" content="/favicons/browserconfig.xml">
                <meta name="theme-color" content="#01101c">
                <title>${name}</title>
                <meta property="og:type" content="website">
                <meta property="twitter:card" content="summary_large_image">
                <meta name="title" content="${name}">
                <meta name="description" content="${overview}">
                <meta property="og:url" content="${link}">
                <meta property="og:title" content="${name}">
                <meta property="og:description" content="${overview}">
                <meta property="og:image" content="${poster}">
                <meta property="twitter:url" content="${link}">
                <meta property="twitter:title" content="${name}">
                <meta property="twitter:description" content="${overview}">
                <meta property="twitter:image" content="${poster}">
            </head>`;
    }

    /**
     * @desc determines if a visitor is a bot or not
     * @param request - request object
     */
    public detectSEOBot(request: NextRequest) {
        const BOT_REGEX = /bot|crawler|baiduspider|80legs|adsbot-google|008|abachobot|accoona-ai-agent|addsugarspiderbot|WhatsApp(\d*\.*)*|anyapexbot|arachmo|b-l-i-t-z-b-o-t|becomebot|beslistbot|billybobbot|bimbot|bingbot|blitzbot|boitho.com-dc|boitho.com-robot|btbot|catchbot|cerberian drtrs|charlotte|converacrawler|cosmos|covario ids|dataparksearch|diamondbot|discobot|dotbot|emeraldshield.com |webbot|esperanzabot|exabot|fast enterprise crawler|fast-webcrawler|fdse robot|findlinks|furlbot|fyberspider|g2crawler|gaisbot|galaxybot|geniebot|gigabot|girafabot|googlebot|googlebot-image|gurujibot|happyfunbot|hl_ftien_spider|holmes|htdig|iaskspider|ia_archiver|iccrawler|ichiro|igdespyder|irlbot|issuecrawler|jaxified bot|jyxobot|koepabot|l.webis|lapozzbot|larbin|ldspider|lexxebot|linguee bot|linkwalker|lmspider|lwp-trivial|mabontland|magpie-crawler|mediapartners-google|mj12bot|mnogosearch|mogimogi|mojeekbot|moreoverbot|morning paper|msnbot|msrbot|mvaclient|mxbot|netresearchserver|netseer crawler|newsgator|ng-search|nicebot|noxtrumbot|nusearch spider|nutchcvs|nymesis|obot|oegp|omgilibot|omniexplorer_bot|oozbot|orbiter|pagebiteshyperbot|peew|polybot|pompos|postpost|psbot|pycurl|pingdom.com_bot_version|qseero|radian6|rampybot|rufusbot|sandcrawler|sbider|scoutjet|scrubby|searchsight|seekbot|semanticdiscovery|sensis web crawler|seochat::bot|seznambot|shim-crawler|shopwiki|shoula robot|silk|sitebot|snappy|sogou spider|sosospider|speedy spider|facebot|twitterbot|sqworm|stackrambler|suggybot|surveybot|synoobot|teoma|terrawizbot|thesubot|thumbnail.cz robot|tineye|truwogps|turnitinbot|tweetedtimes bot|twengabot|updated|urlfilebot|vagabondo|voilabot|vortex|voyager|vyu2|webcollage|websquash.com|wf84|wofindeich robot|womlpefactory|xaldon_webspider|yacy|yahoo! slurp|yahoo! slurp china|yahooseeker|yahooseeker-testing|yandexbot|yandeximages|yasaklibot|yeti|yodaobot|yooglifetchagent|youdaobot|zao|zealbot|zspider|zyborg/i;
        const userAgent = request.headers.get('user-agent');
        return userAgent && BOT_REGEX.test(userAgent.toLowerCase()) || false;
    }

    /**
     * @desc writes a cookie to the response
     * @param res - response object
     * @param data - cookie data
     * @param cookieName - cookie name
     * @param maxAge - cookie max age
     */
    public writeCookie(res: NextApiResponse, data: any, cookieName: string, maxAge: number) {
        const token = data !== null ? this.encrypt(this.secret, data): 'null';

        res.setHeader('Set-Cookie', cookie.serialize(cookieName, token, {
            httpOnly: true,
            maxAge: maxAge,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/'
        }))
    }

    /**
     * @desc gets a file's location from the request
     * @param location - file location
     */
    public async getFileAndAndLocation(location: string) {
        let res: {location: string, download: boolean, name: string} = {
            location: '',
            download: false,
            name: ''
        };

        const { data, error } = await this.supabase
            .from<(View & {video: Video})>('View')
            .select('*,video:Video(*)')
            .eq('auth', location)
            .single();

        if (!error && data) {
            const { video } = data;

            res = {
                location: video.location,
                download: false,
                name: ''
            }

        } else {
            const { data, error } = await this.supabase
                .from<(Download & {view: (View & {episode: Episode, video: (Video & {media: Media})})})>('Download')
                .select('*,view:View(*,episode:Episode(*),video:Video(*,media:Media!Video_mediaId_fkey(*)))')
                .eq('location', location)
                .single();

            if (!error && data) {
                if (data.view.episode) {
                    const { episode, video } = data.view;
                    const { media } = video;
                    const episodeInfo = await this.getEpisode(media.tmdbId, episode.seasonId, episode.episode);
                    res = {
                        location: video.location,
                        download: true,
                        name: media.name + (/^Episode \d+/i.test(episodeInfo?.name || 'Episode 0') ? ` Season ${episode.seasonId} - Episode ${episode.episode}` : ` S${episode.seasonId} - E${episode.episode}: ${episodeInfo?.name}`)
                    }

                } else {
                    const { video } = data.view;
                    res = {
                        location: video.location,
                        download: true,
                        name: video.media.name
                    }
                }
            }
        }

        return res;
    }

    /**
     * @desc authenticates a user with Google oauth
     */
    public async authenticate() {
        if (this.oauth.expiresIn < Date.now()) {
            const url = 'https://www.googleapis.com/oauth2/v4/token'

            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
            }

            const post_data: {[p: string]: any} = {
                client_id: this.oauth.client_id,
                client_secret: this.oauth.client_secret,
                refresh_token: this.oauth.refreshToken,
                grant_type: 'refresh_token',
            }

            const ret = []
            for (let d in post_data) {
                ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(post_data[d]))
            }

            let requestOption = {
                'method': 'POST',
                'headers': headers,
                'body': ret.join('&')
            }

            const response = await fetch(url, requestOption)
            const obj = await response.json()
            if (obj.hasOwnProperty('access_token')) {
                this.oauth.accessToken = obj.access_token
                this.oauth.expiresIn = Date.now() + 3500 * 1000
            }
        }
    }

    /**
     * @desc returns a 206 response with the video
     * @param location - the location of the video
     * @param range - the range of the video
     */
    public async streamFile(location: string, range: string) {
        let res: {location: string, download: boolean, name: string} | null = this.cache.get(location);
        const data = res ? res: await this.getFileAndAndLocation(location);
        this.cache.set(location, data);

        await this.authenticate();
        const headers = {
            'authorization': `Bearer ${this.oauth.accessToken}`,
            'Range': range,
        }

        let url = `https://www.googleapis.com/drive/v3/files/${data.location}?alt=media`
        let response = await fetch(url, {
            'method': 'GET',
            'headers': headers
        })

        if (response.ok) {
            const { headers } = response = new Response(response.body, response);
            let value = !data.download ? 'inline' : 'attachment; filename=' + data.name + ' [frames].mp4'
            headers.set('Content-Disposition', value);
            return response
        }

        return new Response(null, {
            status: data.location !== '' ? 404 : 403,
            statusText: data.location !== '' ? 'Not Found' : 'Forbidden'
        })
    }

    /**
     * @desc returns some information on first page render
     */
    public async getApiKey(){
        return {apiKey: this.realtimeApiKey, globalKey: this.realtimeNotification}
    }

    /**
     * @desc reads the middleware config file
     * @private
     */
    private static readMiddleWareEnv() {
        const restApi = new RestAPI();
        const middleware = restApi.decrypt<MiddleWareInterface>(SECRET, MIDDLEWARE);
        if (middleware)
            return middleware;

        else
            throw new Error('No Configurations found');
    }

}
