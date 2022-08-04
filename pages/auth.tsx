import AuthImages from "../client/next/components/auth/authImages";
import LoginForm from "../client/next/components/auth/form";
import {useRouter} from "next/router";
import {addressAtom, useNavBar} from "../client/next/components/navbar/navigation";
import {useRecoilState, useSetRecoilState} from "recoil";
import {AuthCP} from "../server/classes/middleware";
import {AuthContextHandler} from "../client/next/components/auth/authContext";
import useUser from "../client/utils/user";
import {subscribe, usePageQuery} from "../client/utils/customHooks";

export default function Auth({images, auth}: { auth: AuthCP, images: string[] }) {
    useNavBar('auth', 1);
    const {user, getResetPassword, confirmEmail} = useUser();
    const router = useRouter();
    const [address, setAddress] = useRecoilState(addressAtom);
    const dispatch = useSetRecoilState(AuthContextHandler);

    usePageQuery(async query => {
        if (query.reset || query.verify) {
            dispatch({fade: true});
            if (query.reset) {
                const data = await getResetPassword(query.reset as string);
                dispatch({...data, fade: false});
            } else
                dispatch({
                    error: await confirmEmail(query.verify as string)
                });
        }
    })

    subscribe(async (user) => {
        if (user) {
            const temp = address || '/';
            setAddress(null);
            await router.push(temp);
        }
    }, user)

    return (
        <>
            <AuthImages response={images} auth={auth}/>
            <LoginForm/>
        </>
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
            auth: auth, images: trendingData.map(e => e.poster).slice(0, 10)
        },

        revalidate: 60 * 60 * 2
    }
}
