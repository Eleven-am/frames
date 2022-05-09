import {useNavBar} from "../client/utils/customHooks";
import Background from "../client/next/components/production/back";
import Navbar from "../client/next/components/navbar/navbar";
import {ErrorPage} from "../client/next/components/production/person";
import {useRouter} from "next/router";
import {Header} from "../client/next/components/navbar/navigation";

const metaTags = {
    overview: 'Frames is a streaming service that offers a wide variety of TV shows, movies, anime, documentaries, and more on thousands straight to your browser',
    name: '404: Page Not Found',
    link: 'frames.io',
    poster: '/meta.png'
}

export default function _404({images}: { images: string[] }) {
    useNavBar('auth', 1);
    const asPath = useRouter().asPath;

    return (
        <>
            <Navbar/>
            <Header meta={metaTags}/>
            <Background response={images} />
            <ErrorPage error={{name: '404 page not found', message: `The page you are looking for: ${asPath}, does not exist`}}/>
        </>
    )
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
