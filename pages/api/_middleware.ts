import {NextRequest, NextResponse} from "next/server";
import Middleware, {CookiePayload} from "../../server/classes/middleware";
import {Role} from "@prisma/client";

const middleware = new Middleware();

export default async function (request: NextRequest) {
    const userToken = await middleware.confirmContent<CookiePayload>(request.cookies,'frames-cookie') || {email: 'unknown', context: Role.GUEST, session: 'unknown', validUntil: 0, userId: 'unknown'};
    const url = request.nextUrl.clone();

    if (url.pathname === '/api/streamVideo' && url.searchParams.has('auth'))
        return await middleware.streamFile(url.searchParams.get('auth')!, request.headers.get('range')!);

    return NextResponse.next();
}