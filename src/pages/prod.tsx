import HomeLayout, {MetaTags} from "../../next/states/navigation";
import {useNavBar} from "../../next/utils/customHooks";
import {GetServerSidePropsContext} from "next";
import {FramesCompany} from "../../server/classes/media";
import Background from "../../next/components/production/back";
import Holder from "../../next/components/production/holder";

export default function ProdCompany ({response, meta}: {response: FramesCompany, meta: MetaTags}) {
    useNavBar('prod', 1);

    return (
        <HomeLayout meta={meta}>
            <Background response={response.images}/>
            <Holder response={response}/>
        </HomeLayout>
    )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const pathname = context.query;
    const req = context.req;
    const host = req.headers.host;
    let url = 'http' + (host?.includes('localhost') ? '' : 's') + '://' + host;

    context.res.setHeader(
        'Cache-Control',
        'public, s-maxage=179, stale-while-revalidate=590'
    )

    if (pathname.hasOwnProperty('id')){
        const company = await import('../../next/SSR').then(mod => mod.getProd(pathname.id as string));
        if (company){
            const meta: MetaTags = {
                name: company.name,
                poster: company.logo,
                overview: `See all media produced by ${company.name} available on Frames`,
                link: url + '/productionCompany=' + company.name.replace(/\s/g, '+')
            }

            return {props: {meta, response: company}}
        }

    } else if (pathname.prod) {
        let name = await import('../../next/SSR').then(mod => mod.convertUrl(pathname.prod as string))
        const company = await import('../../next/SSR').then(mod => mod.findProd(name));
        if (company){
            const meta: MetaTags = {
                name: company.name,
                poster: company.logo,
                overview: `See all media produced by ${company.name} available on Frames`,
                link: url + '/productionCompany=' + company.name.replace(/\s/g, '+')
            }

            return {props: {meta, response: company}}
        }
    }

    return {
        redirect: {
            destination: '/',
            permanent: false,
        }
    }
}