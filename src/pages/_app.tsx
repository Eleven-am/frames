import {AppProps} from 'next/app';
import {RecoilRoot} from "recoil";
import {useRouter} from "next/router";
import NProgress from 'nprogress';
import '../../public/nprogress.css';
import {useEffect} from "react";
import {CastContextProvider} from "../../next/utils/castContext";
import {Information} from "../../next/components/misc/inform";
import {BeforeExit} from "../../next/components/misc/Loader";
import {GroupWatchProvider} from "../../next/utils/groupWatch";

export default function MyApp({Component, pageProps}: AppProps) {
    NProgress.configure({trickleSpeed: 1200, showSpinner: false, easing: 'ease-in-out', speed: 500});
    const router = useRouter()
    const handleRouteChange = (url: string, {shallow}: { shallow: boolean }) => {
        if (!shallow)
            NProgress.start()
    }

    useEffect(() => {
        router.events.on('routeChangeStart', handleRouteChange);

        return () => {
            router.events.off('routeChangeStart', handleRouteChange);
        }
    }, [router])

    return (
        <RecoilRoot>
            <CastContextProvider>
                <Information/>
                <GroupWatchProvider>
                    <BeforeExit/>
                    <Component {...pageProps} />
                </GroupWatchProvider>
            </CastContextProvider>
        </RecoilRoot>
    )
}
