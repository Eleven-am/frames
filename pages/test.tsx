import {GetServerSidePropsContext} from "next";
import {MediaType, Role} from "@prisma/client";
import HomeLayout from "../client/next/components/navbar/navigation";
import {useNavBar} from "../client/utils/customHooks";
import Browse from "../client/next/components/browse";
import {CookiePayload} from "../server/classes/middleware";
import {Banner} from "../server/serverFunctions/load";

export default function Test({banner}: { banner: Banner[] }) {
    useNavBar('movies', 1);

    return (
        <HomeLayout>
            <Browse banner={banner}/>
        </HomeLayout>
    );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const MiddleWare = await import("../server/classes/middleware").then(m => m.default);
    const Media = await import("../server/classes/media").then(m => m.default);
    const trendingData = await new Media().getTrending();

    const data = trendingData.map(e => {
        const {id, backdrop, type, trailer, logo, name, overview} = e;
        return {id, backdrop, type, trailer, logo, name, overview}
    }).filter(e => e.logo !== null && e.type === MediaType.MOVIE).slice(0, 10) as Banner[];

    const pop = data.pop();
    const banner = [pop, ...data];
    const middleware = new MiddleWare();

    const {context: role} = await middleware.confirmContent<CookiePayload>(context.req.cookies, 'frames-cookie') || {
        email: 'unknown', context: Role.GUEST, session: 'unknown', validUntil: 0,
    };

    if (role !== Role.ADMIN) return {
        notFound: true
    }

    return {
        props: {
            banner
        }
    }
}