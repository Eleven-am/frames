import {GetServerSidePropsContext} from "next";
import HomeLayout, {MetaTags} from "../client/next/components/navbar/navigation";
import {FramesCollections} from "../server/classes/media";
import {useNavBar} from "../client/utils/customHooks";
import Background from "../client/next/components/production/back";
import {CollectionHolder} from "../client/next/components/production/holder";

export default function Collection({collection, metaTags}: { collection: FramesCollections, metaTags: MetaTags }) {
    useNavBar('collections', 1);

    return (
        <HomeLayout meta={metaTags}>
            <Background response={collection.images}/>
            <CollectionHolder response={collection}/>
        </HomeLayout>
    );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const pathname = context.query;
    const Media = await import("../server/classes/media").then(m => m.default);
    const MiddleWare = await import("../server/classes/middleware").then(m => m.default);
    const media = new Media();
    const middleware = new MiddleWare();

    if (pathname.collectionId || pathname.collectionName) {
        const id = pathname.collectionId as string || '' + (await media.findCollection(middleware.convertUrl(pathname.collectionName as string)));
        const collection = await media.getCollection(+id);
        if (collection) {
           const metaTags: MetaTags = {
               name: collection.name,
               overview: 'See all the media in the ' + collection.name + ' collection.',
               link: `/collection=${collection.id}`,
               poster: collection.poster,
           };

           return {
               props: {
                   metaTags,
                   collection,
               },
           };
        }
    }

    return {
        redirect: {
            destination: '/',
            permanent: false,
        }
    }
}