import {GetServerSidePropsContext} from "next";
import {Role} from "@prisma/client";
import {useNavBar} from "../client/next/components/navbar/navigation";
import {TrendingCollection} from "../client/next/components/entities/section";

export default function Test() {
    useNavBar('watch', 1);

    return (
        <>
            <TrendingCollection/>
        </>
    )
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
    const AuthService = await import("../server/classes/auth").then(m => m.default);
    const MiddleWare = await import("../server/classes/middleware").then(m => m.default);

    const authService = new AuthService();
    const middleware = new MiddleWare();

    const data = await middleware.readCookie(ctx.req.cookies, 'frames-cookie');
    const presentUser = await authService.getUserFromSession(data.session);

    if (presentUser?.role !== Role.ADMIN)
        return {
            notFound: true
        }

    return {
        props: {}
    }
}
