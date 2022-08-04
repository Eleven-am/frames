import {AppProps} from 'next/app';
import {RecoilRoot} from "recoil";
import '../client/next/assets/nprogress.css';
import '../client/next/assets/index.css';
import {FramesConsumers} from "../client/utils/provider";

export default function MyApp({Component, pageProps}: AppProps) {

    return (
        <RecoilRoot>
            <FramesConsumers>
                <Component {...pageProps} />
            </FramesConsumers>
        </RecoilRoot>
    )
}
