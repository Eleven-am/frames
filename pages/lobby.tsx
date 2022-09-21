import {useNavBar} from "../client/next/components/navbar/navigation";
import Lobby from "../client/next/components/lobby";

export default function Index({images}: { images: string[] }) {
    useNavBar('groupWatch', 1);

    return <Lobby response={images}/>
}


export async function getStaticProps() {
    const Media = await import("../server/classes/media").then(m => m.default);

    const media = new Media();
    const trendingData = await media.getTrending();

    return {
        props: {
            images: trendingData.map(e => e.poster).slice(0, 10)
        },

        revalidate: 60 * 60 * 2
    }
}
