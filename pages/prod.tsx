import HomeLayout, {MetaTags} from "../client/next/components/navbar/navigation";
import {useNavBar} from "../client/utils/customHooks";
import {GetServerSidePropsContext} from "next";
import {ProductionCompanyInterface} from "../server/classes/media";
import Background from "../client/next/components/production/back";
import Holder from "../client/next/components/production/holder";

export default function Prod({prod, metaTags}: {prod: ProductionCompanyInterface, metaTags: MetaTags}) {
    useNavBar('others', 1);

    return (
        <HomeLayout meta={metaTags}>
            <Background response={prod.images}/>
            <Holder response={prod}/>
        </HomeLayout>
    );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const pathname = context.query;
    const Media = await import("../server/classes/media").then(m => m.default);
    const MiddleWare = await import("../server/classes/middleware").then(m => m.default);
    const media = new Media();
    const middleware = new MiddleWare();

    if (pathname.id || pathname.prod) {
        const id = pathname.id as string || '' + (await media.findProductionCompany(middleware.convertUrl(pathname.prod as string)));
        const prod = await media.getProductionCompany(id);
        if (prod) {
            const metaTags: MetaTags = {
                name: prod.name,
                overview: 'See all the media produced by ' + prod.name,
                poster: prod.logo,
                link: '/productionCompany=' + prod.name.replace(/\s/g, '+'),
            }

            return {
                props: {
                    metaTags,
                    prod,
                }
            }
        }
    }

    return {
        redirect: {
            destination: '/',
            permanent: false,
        }
    }
}