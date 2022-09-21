import React, {useState} from "react";
import {useNavBar} from "../client/next/components/navbar/navigation";
import Trending from "../client/next/components/trending/trending";
import HomeSections from "../client/next/components/homeSection/homeSections";
import {Banner} from "../server/classes/media";
import ErrorBoundary from "../client/next/components/misc/ErrorBoundary";

export default function Home({banner}: { banner: Banner[] }) {
    const [stop, setStop] = useState(false);
    useNavBar('home', 1);

    return (
        <ErrorBoundary>
            <Trending stop={stop} response={banner}/>
            <HomeSections stop={setStop}/>
        </ErrorBoundary>
    )
}

export async function getStaticProps() {
    const Media = await import("../server/classes/media").then(m => m.default);
    const trendingData = await new Media().getTrending();

    const banner = trendingData.map(e => {
        const {id, backdrop, type, trailer, logo, name, overview} = e;
        return {id, backdrop, type, trailer, logo, name, overview}
    }).filter(e => e.logo !== null).slice(0, 7) as Banner[];

    return {props: {banner}, revalidate: 60 * 60}
}
