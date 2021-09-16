import {FramesCollection} from "../../server/classes/media";
import HomeLayout, {MetaTags} from "../../next/states/navigation";
import {useNavBar} from "../../next/utils/customHooks";
import Background from "../../next/components/production/back";
import {CollectionHolder} from "../../next/components/production/holder";
import {GetServerSidePropsContext} from "next";

export default function ProdCompany({response, meta}: { response: FramesCollection, meta: MetaTags }) {
    useNavBar('prod', 1);

    return (
        <HomeLayout meta={meta}>
            <Background response={response.images}/>
            <CollectionHolder response={response}/>
        </HomeLayout>
    )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const pathname = context.query;
    const req = context.req;
    const host = req.headers.host;
    let url = 'http' + (host?.includes('localhost') ? '' : 's') + '://' + host;

    if (pathname.collectionId) {
        const company = await import('../../next/SSR').then(mod => mod.getCollection(+(pathname.collectionId!)));
        if (company) {
            const meta: MetaTags = {
                name: company.name,
                poster: company.poster,
                overview: `See all media in the ${company.name} available on Frames`,
                link: url + '/collection=' + company.name.replace(/\s/g, '+')
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
