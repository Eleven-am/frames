import { RestAPI } from "./server/classes/stringExt";
import { MiddleWareInterface , FRAMES_INTERFACE} from "./server/lib/environment";
import * as fs from "fs";

const restAPI = new RestAPI();

const framesConfig = {
    databaseURL: '', // Your Postgress database url
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
        useragent: '', // The useragent for the open subtitles api.
        username: '', // The username for the open subtitles api.
        password: '' // The password for the open subtitles api.
    },
    token: { // Your token object returned from the google api after you have authenticated.
        access_token: '', // The access token for the google api.
        refresh_token: '', // The refresh token for the google api.
        scope: '', // The scope for the google api.
        token_type: '', // The token type for the google api.
        id_token: '', // The id token for the google api.
        expiry_date: 0 // The expiry date for the google api.
    },
    credentials: { // Your google api credentials.
        client_id: '', // The client id for the google api.
        project_id:'', // The project id for the google api.
        auth_uri: '', // The auth uri for the google api.
        token_uri: '', // The token uri for the google api.
        auth_provider_x509_cert_url: '', // The auth provider x509 cert url for the google api.
        client_secret: '', // The client secret for the google api.
        redirect_uris: '' // The redirect uris for the google api.
    },
    privateConfig: {
        cdn: '/api/streamVideo?auth=', // The url to stream a file from || could also be a link to a cloudflare worker.
        cypher: '', // The cypher to use for encrypting the private config.
        admin_mail: '', // The email address of the admin.
        admin_pass: '', // The admin password. This is used to login to frames as admin.
        deleteAndRename: true, // if true, frames would be able to delete and rename files. Repeated files or unspported files like .srt would be deleted.
    }
}

const configFunction = () => {
    const secret  = restAPI.createUUID(); // Create a secret for the rest api.
    const notificationId = restAPI.generateKey(13, 5); // Create a notification id for the rest api.
    const middleWareData: MiddleWareInterface = {
        client_id: framesConfig.credentials.client_id,
        client_secret: framesConfig.credentials.client_secret,
        accessToken: framesConfig.token.access_token,
        refresh_token: framesConfig.token.refresh_token,
        expiry_date: framesConfig.token.expiry_date,
        cypher: framesConfig.privateConfig.cypher,
        secret: secret,
        externalApis: {...framesConfig.externalApis, databaseUrl: framesConfig.databaseURL},
        globalNotification: notificationId
    };

    const encryptedMiddleWareData = restAPI.encrypt(secret, middleWareData);

    const otherData: FRAMES_INTERFACE = {
        privateConfig: {...framesConfig.privateConfig, notificationId, library: framesConfig.library, secret},
        externalApis: {...framesConfig.externalApis},
        token: framesConfig.token,
        credentials: framesConfig.credentials,
        others: {deluge: framesConfig.deluge, openSubtitles: framesConfig.openSubtitles}
    };

    const encryptedOtherData = restAPI.encrypt(secret, otherData);

    const stringifiedData = `DATABASE_URL=${framesConfig.databaseURL}\nMIDDLEWARE=${encryptedMiddleWareData}\nFRAMES_CONFIG=${encryptedOtherData}\nSECRET=${secret}`;
    fs.writeFileSync('.env', stringifiedData);
    console.log('env_bak file created');
    console.log('Please make sure you have the following in your .gitignore file: .env');
    console.log('\n');
    console.log('If you intend to run this on vercel, set this value to the MIDDLEWARE environment variable:');
    console.log('\n');
    console.log(encryptedMiddleWareData);
    console.log('\n');
    console.log('and set your SECRET environment variable to:');
    console.log(secret);

}

configFunction();
