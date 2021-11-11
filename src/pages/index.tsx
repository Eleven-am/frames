import HomeLayout from "../../next/states/navigation";
import Trending from "../../next/components/trending/trending";
import HomeSections from "../../next/components/homeSection/homeSections";
import {useNavBar} from "../../next/utils/customHooks";
import {Banner} from "../../server/classes/springboard";
import {useEffect} from "react";
import useCast from "../../next/utils/castContext";

export default function Index({banner, segments}: { banner: Banner[], segments: string[] }) {
    useNavBar('home', 1);
    const {sendMessage} = useCast();

    useEffect(() => {
        sendMessage({action: 'home'});
    }, [])

    return (
        <HomeLayout>
            <Trending response={banner}/>
            <HomeSections response={segments}/>
        </HomeLayout>
    )
}

export async function getStaticProps() {
    const banner = await import('../../next/SSR').then(mod => mod.banner());
    const segments = await import('../../next/SSR').then(mod => mod.segment());

    return {props: {banner, segments}, revalidate: 86400};
}