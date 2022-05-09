import {NextRequest, NextResponse} from "next/server";
import Middleware, {CookiePayload} from "../server/classes/middleware";
import {Role} from "@prisma/client";

const middleware = new Middleware();

const getExtension = (url: string) => {
    const extension = url.split('.').pop();
    return !/^\/\w*/.test(extension || '') ? extension ? extension : 'unknown' : 'unknown';
}

const verifyAccess = async function (request: NextRequest, response: NextResponse) {
    const userToken = await middleware.confirmContent<CookiePayload>(request.cookies, 'frames-cookie') || {email: 'unknown', context: Role.GUEST, session: 'unknown', validUntil: 0, userId: 'unknown'};
    const valid = Date.now() < userToken.validUntil;
    const path = request.nextUrl.pathname;
    const extension = getExtension(path);
    const isSEOBot = middleware.detectSEOBot(request);
    const url = request.nextUrl.clone();
    url.pathname = '/auth';

    if (isSEOBot) {
        if (extension !== 'unknown')
            return response;

        const html = await middleware.createHTML(path);
        return new Response(html, {
            headers: {
                "content-type": "text/html;charset=UTF-8",
            },
        })
    }

    if (path === '/midIn' || path === '/getApiKey') {
        const {email, context, session} = userToken;
        const res = path === '/getApiKey' ? await middleware.getApiKey(): !valid ? {error: 'access unauthorised'} : {
            context: {
                email,
                session,
                role: context
            }
        };

        return new Response(JSON.stringify(res), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        })

    } else if (path === '/midOut')
        return NextResponse.redirect(url).cookie('frames-cookie', 'null', {
            maxAge: 0,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });

    else if (extension !== 'unknown')
        return response;

    else if (!valid && !/\/api\/(auth|stream)/.test(path) && !/\/frame=|\/auth/.test(path))
        return NextResponse.redirect(url);

    else if (valid && path === '/auth' ) {
        if (request.redirect ===  'follow')
            return response;

        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    return response;
}

export default async function (req: NextRequest) {
    return await verifyAccess(req, NextResponse.next())
}

