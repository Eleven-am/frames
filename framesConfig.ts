import { BaseClass } from "./server/classes/base";
import {MiddleWareInterface, FRAMES_INTERFACE, GoogleToken} from "./server/lib/environment";
import * as fs from "fs";
import {google} from "googleapis";
import readline from "readline";

const restAPI = new BaseClass();

const scopes = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
];

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
    credentials: { // Your google api credentials.
        client_id: "", // Your client id.
        project_id: "", // Your project id.
        auth_uri: "", // Your auth uri.
        token_uri: "", // Your token uri.
        auth_provider_x509_cert_url: "", // Your auth provider x509 cert url.
        client_secret: "", // Your client secret.
        redirect_uris: [""] // Your redirect uris.
    },
    privateConfig: {
        cdn: '/api/streamVideo?auth=', // The url to stream a file from || could also be a link to a cloudflare worker.
        admin_mail: '', // The email address of the admin.
        admin_pass: '', // The admin password. This is used to login to frames as admin.
        deleteAndRename: true, // if true, frames would be able to delete and rename files. Repeated files or unspported files like .srt would be deleted.
    }
}

const getAccessToken = (clientId: string, clientSecret: string, redirect_uri: string) => {
    return new Promise<GoogleToken | null>((resolve) => {
        const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirect_uri);
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes
        });
        console.log('Authorize this app by visiting this url:', authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) {
                    console.error('Error retrieving access token', err);
                    resolve(null);
                }
                resolve(token as GoogleToken);
            });
        });
    });
}

const configFunction = async () => {
    const secret  = restAPI.createUUID(); // Create a secret for the rest api.
    const notificationId = restAPI.generateKey(32, 1); // Create a notification id for the rest api.
    const cypher = restAPI.createUUID(); // Create a cypher for the rest api.
    const googleToken = await getAccessToken(framesConfig.credentials.client_id, framesConfig.credentials.client_secret, framesConfig.credentials.redirect_uris[0]); // Get the google token.
    if (googleToken === null)
        throw new Error('Could not get google token.');

    const middleWareData: MiddleWareInterface = {
        client_id: framesConfig.credentials.client_id,
        client_secret: framesConfig.credentials.client_secret,
        accessToken: googleToken.access_token,
        refresh_token: googleToken.refresh_token,
        expiry_date: googleToken.expiry_date,
        cypher: cypher,
        secret: secret,
        externalApis: {...framesConfig.externalApis},
        globalNotification: notificationId
    };

    const encryptedMiddleWareData = restAPI.encrypt(secret, middleWareData);

    const otherData: FRAMES_INTERFACE = {
        privateConfig: {...framesConfig.privateConfig, notificationId, cypher, library: framesConfig.library, secret},
        externalApis: {...framesConfig.externalApis},
        token: googleToken,
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
