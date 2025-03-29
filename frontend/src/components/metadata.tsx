interface MetadataTags {
    name: string;
    overview: string;
    poster: string | null;
    link: string;
}

const defaultMetadata = {
    overview: 'Frames is a streaming service that offers a wide variety of TV shows, movies, anime, documentaries, and more on thousands straight to your browser',
    name: 'Frames - Watch FREE TV Shows and Movies Online',
    link: '/',
    poster: '/meta.png',
};

interface MetadataProps {
    metadata?: MetadataTags;
    title?: string;
}

export function Metadata ({ metadata = defaultMetadata, title }: MetadataProps) {
    const { name, overview, poster, link } = metadata;

    return (
        <>
            <meta charSet="UTF-8" />
            <meta content="width=device-width, initial-scale=1.0" name="viewport" />

            <link rel="apple-touch-icon" sizes="180x180" href="favicons/apple-touch-icon.png" />
            <link rel="icon" type="image/png" sizes="32x32" href="favicons/favicon-32x32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="favicons/favicon-16x16.png" />
            <link rel="manifest" href="favicons/site.webmanifest" />
            <link rel="mask-icon" href="favicons/safari-pinned-tab.svg" color="#5bbad5" />
            <link rel="shortcut icon" href="favicons/favicon.ico" />
            <meta name="msapplication-TileColor" content="#da532c" />
            <meta name="msapplication-config" content="/favicons/browserconfig.xml" />
            <meta name="theme-color" content="#ffffff" />

            <title>{title || name}</title>
            <meta name="title" content={name} />
            <meta name="description" content={overview} />

            <meta property="og:type" content="website" />
            <meta property="og:url" content={link} />
            <meta property="og:title" content={name} />
            <meta property="og:description" content={overview} />
            <meta property="og:image" content={poster || defaultMetadata.poster} />

            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={link} />
            <meta property="twitter:title" content={name} />
            <meta property="twitter:description" content={overview} />
            <meta property="twitter:image" content={poster || defaultMetadata.poster} />
        </>
    );
}
