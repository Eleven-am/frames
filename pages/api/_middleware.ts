import {NextRequest, NextResponse} from "next/server";
import Middleware from "../../server/classes/middleware";

const middleware = new Middleware();

export default async function (request: NextRequest) {
    const userToken = await middleware.readCookie(request.cookies, 'frames-cookie');
    const url = request.nextUrl.clone();
    const host = url.hostname;

    if (url.pathname === '/api/streamVideo' && url.searchParams.has('auth') && userToken.validUntil > Date.now())
        return await middleware.streamFile(host, url.searchParams.get('auth')!, request.headers.get('range')!);

    return NextResponse.next();
}
