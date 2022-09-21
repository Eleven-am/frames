import {useNavBar} from "../client/next/components/navbar/navigation";
import {useDetectPageChange} from "../client/utils/customHooks";
import {Browse} from "../client/next/components/browse";
import {useEffect} from "react";
import useOnScroll from "../client/utils/opacityScroll";
import {BrowseData} from "../server/classes/media";
import {GetServerSidePropsContext} from "next";
import {MediaType} from "@prisma/client";

export default function Library({data}: { data: BrowseData }) {
    const {reset} = useOnScroll();
    const {loading, router} = useDetectPageChange(true);
    const type = router.asPath.includes('movies') ? 'movies' : 'tv shows';
    useNavBar(type, 1);

    useEffect(() => {
        loading && reset();
        return () => reset();
    }, [loading]);

    return <Browse data={data}/>;
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
    const Media = await import("../server/classes/media").then(m => m.default);
    const media = new Media();

    const pathname = ctx.query;
    const type = pathname.type === 'movie' ? MediaType.MOVIE : MediaType.SHOW;
    const data = await media.getDataForBrowse(type);

    ctx.res.setHeader('Cache-Control', 's-maxage=7200, stale-while-revalidate');

    return {
        props: {
            data
        }
    }
}
