import { RestAPI } from "./server/classes/stringExt";
import { MiddleWareInterface , FRAMES_INTERFACE} from "./server/lib/environment";
import * as fs from "fs";

const restAPI = new RestAPI();

const framesConfig = {
    databaseURL: '', // Your database URL. This can be gotten on your supabase console.
    externalApis: {
        tmdbApiKey: '', // Your TMDB API key.
        fanArtApiKey: '', // Your fanart.tv API key.
        realTimeApiKey: '' // Eventually this would be an api key for the Phoenix channels realtime api I am trying to make public.
    },
    library: {
        movies: '', // the google drive folder id for the movies library.
        tvShows: '' // the google drive folder id for the tv shows library.
    },
    deluge: { // Deluge credentials. CAN BE NULL.
        deluge_url: '', // The url to your deluge web interface.
        directory: '', // The directory where your deluge downloads are stored.
        password: '' // The password for your deluge web interface.
    },
    openSubtitles: { // the open subtitles config. CAN BE NULL.
        useragent: '',
        username: '',
        password: ''
    },
    token: { // Your token object returned from the google api after you have authenticated.
        access_token: '',
        refresh_token: '',
        scope: '',
        token_type: '',
        id_token: '',
        expiry_date: 0
    },
    credentials: { // Your google api credentials.
        client_id: '',
        project_id: '',
        auth_uri: '',
        token_uri: '',
        auth_provider_x509_cert_url: '',
        client_secret: '',
        redirect_uris: []
    },
    privateConfig: {
        cdn: '/api/streamVideo?auth=', // The url to stream a file from.
        cypher: '', // The cypher to use for encrypting the private config.
        admin_mail: '', // The email address of the admin.
        admin_pass: '', // The admin password. This is used to login to frames as admin.
        secret: '', // The secret key for the encryption. also used to encrypt the session cookie.
        deleteAndRename: true, // if true, frames would be able to delete and rename files. Repeated files or unspported files like .srt would be deleted.
        notificationId: '' // The notification id for the push notification. Should be unique(uuid v4).
    },
    supabase: { // The supabase credentials.
        supabaseEndpoint: '',
        supabasePublicKey: '',
        supabasePrivateKey: ''
    }
}

const configFunction = () => {
    const middleWareData: MiddleWareInterface = {
        client_id: framesConfig.credentials.client_id,
        client_secret: framesConfig.credentials.client_secret,
        accessToken: framesConfig.token.access_token,
        refresh_token: framesConfig.token.refresh_token,
        expiry_date: framesConfig.token.expiry_date,
        cypher: framesConfig.privateConfig.cypher,
        secret: framesConfig.privateConfig.secret,
        externalApis: {...framesConfig.externalApis, supabase: framesConfig.supabase},
        globalNotification: framesConfig.privateConfig.notificationId
    };

    const encryptedMiddleWareData = restAPI.encrypt(framesConfig.privateConfig.secret, middleWareData);

    const otherData: FRAMES_INTERFACE = {
        privateConfig: {...framesConfig.privateConfig, library: framesConfig.library},
        externalApis: {...framesConfig.externalApis, supabase: framesConfig.supabase},
        token: framesConfig.token,
        credentials: framesConfig.credentials,
        others: {deluge: framesConfig.deluge, openSubtitles: framesConfig.openSubtitles}
    };

    const encryptedOtherData = restAPI.encrypt(framesConfig.privateConfig.secret, otherData);

    const stringifiedData = `DATABASE_URL=${framesConfig.databaseURL}\nMIDDLEWARE=${encryptedMiddleWareData}\nFRAMES_CONFIG=${encryptedOtherData}\nSECRET=${framesConfig.privateConfig.secret}`;
    fs.writeFileSync('.env', stringifiedData);
    console.log('env_bak file created');
    console.log('Please make sure you have the following in your .gitignore file: .env');
    console.log('\n');
    console.log('If you intend to run this on vercel, copy the following to your ./server/class/middleware.ts file:');
    console.log(`const MIDDLEWARE = '${encryptedMiddleWareData}';`);
    console.log('\n');
    console.log(`const SECRET = '${framesConfig.privateConfig.secret}';`);

}