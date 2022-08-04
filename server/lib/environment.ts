import {RestAPI} from "../classes/stringExt";

export type tmdbToken = { apiKey: string, fanArtApiKey: string, realTimeApiKey: string };

export interface GoogleToken {
    access_token: string,
    id_token: string,
    refresh_token: string,
    scope: string,
    token_type: string,
    expiry_date: number
}

export interface GoogleCred {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_secret: string;
    redirect_uris: string | string[];
}

export interface DelugeCred {
    deluge_url: string;
    directory: string;
    password: string;
}

export interface OpenSubs {
    useragent: string;
    username: string;
    password: string;
}

export interface Library {
    movies: string,
    tvShows: string
}

export interface UserDetails {
    cdn: string;
    cypher: string;
    admin_mail: string;
    admin_pass: string;
    secret: string;
    deleteAndRename: boolean;
    notificationId: string;
    library: Library;
}

export interface Regrouped {
    tmdbToken: tmdbToken | null,
    token: GoogleToken | null,
    openSubtitles: OpenSubs | null,
    deluge: DelugeCred | null,
    credentials: GoogleCred | null,
    user: UserDetails | null,
    usenet: { apiKey: string; base: string; home_url: string; username: string; password: string; } | null,
}

export interface MiddleWareInterface {
    client_id: string;
    client_secret: string;
    accessToken: string;
    refresh_token: string;
    expiry_date: number;
    cypher: string;
    secret: string;
    externalApis: {
        tmdbApiKey: string;
        fanArtApiKey: string;
        realTimeApiKey: string;
        databaseUrl: string;
    };
    globalNotification: string;
}

export interface FRAMES_INTERFACE {
    privateConfig: UserDetails;
    externalApis: {
        tmdbApiKey: string;
        fanArtApiKey: string;
        realTimeApiKey: string;
    };
    token: GoogleToken;
    credentials: GoogleCred;
    others: {
        deluge: DelugeCred;
        openSubtitles: OpenSubs;
    };
}

function readFramesEnv() {
    const restApi = new RestAPI();
    const secret = process.env.SECRET || '';
    const data = process.env.FRAMES_CONFIG || '';

    const frames = restApi.decrypt<FRAMES_INTERFACE>(secret, data);
    if (frames) {
        const data: Regrouped = {
            tmdbToken: {
                apiKey: frames.externalApis.tmdbApiKey,
                fanArtApiKey: frames.externalApis.fanArtApiKey,
                realTimeApiKey: frames.externalApis.realTimeApiKey
            },
            token: frames.token, openSubtitles: frames.others.openSubtitles, deluge: frames.others.deluge,
            credentials: frames.credentials, user: frames.privateConfig,
            usenet: null
        }

        return data;
    } else
        throw new Error('No Configurations found');
}

const regrouped = readFramesEnv();
export {regrouped};
