import HomeLayout from "../../next/states/navigation";
import Trending from "../../next/components/trending/trending";
import HomeSections from "../../next/components/homeSection/homeSections";
import {useNavBar} from "../../next/utils/customHooks";
import {Banner} from "../../server/classes/springboard";
import {GetServerSidePropsContext} from "next";

export default function Index({banner, segments}: { banner: Banner[], segments: string[] }) {
    useNavBar('home', 1);

     return (
        <HomeLayout>
            <Trending response={banner}/>
            <HomeSections response={segments}/>
        </HomeLayout>
    )
}

export async function getServerSideProps({res}: GetServerSidePropsContext) {
    res.setHeader(
        'Cache-Control',
        'public, s-maxage=179, stale-while-revalidate=590'
    )

    const banner = await import('../../next/SSR').then(mod => mod.banner());
    const segments = await import('../../next/SSR').then(mod => mod.segment());

    return {props: {banner, segments}};
}