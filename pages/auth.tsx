import AuthImages from "../client/next/components/auth/authImages";
import LoginForm from "../client/next/components/auth/form";
import {useNavBar} from "../client/utils/customHooks";
import {useRouter} from "next/router";
import {Loading} from "../client/next/components/misc/Loader";
import {useEffect} from "react";
import HomeLayout, {addressAtom} from "../client/next/components/navbar/navigation";
import useUser from "../client/utils/userTools";
import {useRecoilState} from "recoil";
import {AuthCP} from "../server/classes/middleware";

export default function Auth({images, auth}: { auth: AuthCP, images: string[] }) {
    useNavBar('auth', 1);
    const {user, loading} = useUser();
    const router = useRouter();
    const [address, setAddress] = useRecoilState(addressAtom);

    useEffect(() => {
        if (user) {
            const temp = address || '/';
            setAddress(null);
            router.push(temp);
        }
    }, [user])

    if (loading)
        return <Loading/>

    return (
        <HomeLayout>
            <AuthImages response={images} auth={auth} />
            <LoginForm />
        </HomeLayout>
    )
}

export async function getStaticProps() {
    const Media = await import("../server/classes/media").then(m => m.default);
    const Middleware = await import("../server/classes/middleware").then(m => m.default);

    const media = new Media();
    const middleware = new Middleware();
    const trendingData = await media.getTrending();
    const auth = await middleware.getAuthCpRight();

    return {
        props: {
            auth: auth,
            images: trendingData.map(e => e.poster).slice(0, 10)
        },

        revalidate: 60 * 60 * 2
    }
}
