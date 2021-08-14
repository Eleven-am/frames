import {GetServerSidePropsContext} from "next";
import {FramesPerson} from "../../server/base/tmdb_hook";
import HomeLayout, {MetaTags} from "../../next/states/navigation";
import {useNavBar} from "../../next/utils/customHooks";
import Background from "../../next/components/production/back";
import Holder from "../../next/components/production/person";

export default function Person({person, images, meta}: {meta: MetaTags, images: string[], person: FramesPerson}) {
    useNavBar('person', 1);

    return(
        <HomeLayout meta={meta}>
            <Background response={images}/>
            <Holder person={person}/>
        </HomeLayout>
    )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const pathname = context.query;
    const req = context.req;

    const host = req.headers.host;
    let url = 'http' + (host?.includes('localhost') ? '' : 's') + '://' + host;

    if (pathname.hasOwnProperty('id')) {
        const person = await import('../../next/SSR').then(mod => mod.getPerson(+(pathname.id!))) as FramesPerson;
        let images = person.tv_cast.concat(person.movie_cast).concat(person.production).map(e => {
            return {
                poster: e.poster || '', id: e.id
            }
        }).uniqueID('id');

        images = images.randomiseDB(images.length, 0);

        const meta: MetaTags = {
            name: person.name,
            poster: person.poster,
            overview: `See all media produced by ${person.name} available on Frames`,
            link: url + '/person=' + person.name.replace(/\s/g, '+')
        }

        return ({props: {meta, person, images: images.map(e => e.poster)}})

    } else if (pathname.person) {
        let name = await import('../../next/SSR').then(mod => mod.convertUrl(pathname.person as string))
        const person = await import('../../next/SSR').then(mod => mod.findPerson(name));
        if (person){
            let images = person.tv_cast.concat(person.movie_cast).concat(person.production).map(e => {
                return {
                    poster: e.poster || '', id: e.id
                }
            }).uniqueID('id');

            images = images.randomiseDB(images.length, 0);

            const meta: MetaTags = {
                name: person.name,
                poster: person.poster,
                overview: `See all media produced by ${person.name} available on Frames`,
                link: url + '/person=' + person.name.replace(/\s/g, '+')
            }

            return ({props: {meta, person, images: images.map(e => e.poster)}})
        }
    }

    return {
        redirect: {
            destination: '/',
            permanent: false,
        }
    }
}