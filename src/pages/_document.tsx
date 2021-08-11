import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
    render() {
        return (
            <Html>
                <Head />
                <body>
                <link rel="stylesheet" href="/index.css"/>
                <div id="background">
                    <img src="/background.jpg"/>
                </div>
                <Main />
                <NextScript />
                <script src="https://www.youtube.com/iframe_api"/>
                </body>
            </Html>
        )
    }
}