import {GetServerSidePropsContext} from "next";
import HomeLayout, {MetaTags} from "../client/next/components/navbar/navigation";
import {PersonInterface} from "../server/classes/media";
import Background from "../client/next/components/production/back";
import {useNavBar} from "../client/utils/customHooks";
import Holder from "../client/next/components/production/person";

export default function Person({person, metaTags}: { person: PersonInterface, metaTags: MetaTags }) {
    useNavBar('others', 1);

    return (
        <HomeLayout meta={metaTags}>
            <Background response={person.images} />
            <Holder person={person} />
        </HomeLayout>
    )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const pathname = context.query;
    const Media = await import("../server/classes/media").then(m => m.default);
    const MiddleWare = await import("../server/classes/middleware").then(m => m.default);
    const media = new Media();
    const middleware = new MiddleWare();

    if (pathname.id || pathname.person) {
        const id = pathname.id as string || '' + (await media.findPerson(middleware.convertUrl(pathname.person as string)));
        const person = await media.getPerson(+id);
        if (person) {
            const metaTags: MetaTags = {
                name: person.name,
                overview: `See all media by ${person.name} available on Frames`,
                link: `/person=${person.name.replace(/\s/g, '+')}`,
                poster: person.photo
            }

            return {
                props: {
                    person,
                    metaTags
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