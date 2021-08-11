interface Env {
    token: { access_token: string, id_token: string, scope: string, token_type: string, expiry_date: number };
    library: { movies: string, tvShows: string };
    openSubtitles: { useragent: string; username: string; password: string; } | null;
    deluge: { deluge_url: string; directory: string; password: string; } | null;
    usenet: { apiKey: string; base: string; home_url: string; username: string; password: string; } | null;
    cypher: string;
    admin_mail: string;
    admin_pass: string;
    cdn: string;
    secret: string;
    deleteAndRename: boolean;
}

interface Credentials {
    web: {
        client_id: string;
        project_id: string;
        auth_uri: string;
        token_uri: string;
        auth_provider_x509_cert_url: string;
        client_secret: string;
        redirect_uris: string | string[];
    },
    tmdb_api: { base: string; apiKey: string; },
    fanArt: { base: string; apiKey: string; },
}

function getEnv () {
    let frames = process.env.FRAMES || '';
    let data = process.env.CONFIG || '';
    data = Buffer.from(data, "base64").toString("utf-8");
    frames = Buffer.from(frames, "base64").toString("utf-8");
    const config: Env = JSON.parse(frames);
    const credentials: Credentials = JSON.parse(data);
    return {config, credentials}
}

const environment = getEnv();
export default environment;