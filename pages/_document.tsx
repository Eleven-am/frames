import {Html, Head, Main, NextScript} from 'next/document';

export default function Document() {
    return (
        <Html>
            <Head>
                <link rel="manifest" href="/manifest.json"/>
                <link rel="apple-touch-icon" href="/icon-512x512"/>
                <meta name="theme-color" content="#01101c"/>
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}