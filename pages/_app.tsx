import {AppProps} from 'next/app';
import {RecoilRoot} from "recoil";
import NProgress from 'nprogress';
import {useEffect} from "react";
import '../client/next/assets/nprogress.css';
import '../client/next/assets/index.css';
import {useDetectPageChange} from "../client/utils/customHooks";
import FramesConsumers from "../client/utils/Providers";

export default function MyApp({Component, pageProps}: AppProps) {
    NProgress.configure({trickleSpeed: 1200, showSpinner: false, easing: 'ease-in-out', speed: 500});
    const {loading} = useDetectPageChange();

    useEffect(() => {
        loading ? NProgress.start() : NProgress.done();
    }, [loading]);

    return (
        <RecoilRoot>
            <FramesConsumers>
                <Component {...pageProps} />
            </FramesConsumers>
        </RecoilRoot>
    )
}
