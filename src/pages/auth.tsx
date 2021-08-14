import {addressAtom, Header} from "../../next/states/navigation";
import {useEffect} from "react";
import {useRouter} from "next/router";
import Navbar from "../../next/components/navbar/navbar";
import AuthImages from "../../next/components/auth/auth/authImages";
import LoginForm from "../../next/components/auth/form";
import useUser from "../../next/utils/userTools";
import {useNavBar} from "../../next/utils/customHooks";
import {useRecoilState} from "recoil";
import {AuthCP} from '../../next/SSR';

const metaTags = {
    overview: 'Frames is a streaming service that offers a wide variety of TV shows, movies, anime, documentaries, and more on thousands straight to your browser',
    name: 'Authenticate to Frames',
    link: 'frames.io',
    poster: '/meta.png'
}

export default function Auth({images, auth}: {auth: AuthCP, images: string[]}) {
    const {user} = useUser();
    const router = useRouter();
    const [address, setAddress] = useRecoilState(addressAtom);
    useNavBar('login', 1);

    useEffect(() => {
        if (user) {
            const temp = address || '/';
            setAddress(null);
            router.push(temp);
        }
    }, [user])

    return(
        <>
            <Navbar/>
            <Header meta={metaTags}/>
            <AuthImages response={images} auth={auth}/>
            <LoginForm/>
        </>
    )
}

export async function getServerSideProps() {
    const images = await import('../../next/SSR').then(mod => mod.getAuthImages());
    const auth = await import('../../next/SSR').then(mod => mod.getAuthCpRight());
    return {props: {images, auth}};
}

