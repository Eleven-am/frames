import {NextRequest, NextResponse} from "next/server";
import Middleware from "../server/classes/middleware";

const middleware = new Middleware();

const getExtension = (url: string) => {
    const extension = url.split('.').pop();
    return !/^\/\w*/.test(extension || '') ? extension ? extension : 'unknown' : 'unknown';
}

const verifyAccess = async function (request: NextRequest, response: NextResponse) {
    const userToken = await middleware.readCookie(request.cookies, 'frames-cookie');
    const valid = Date.now() < userToken.validUntil;
    const path = request.nextUrl.pathname;
    const extension = getExtension(path);
    const isSEOBot = middleware.detectSEOBot(request);
    const url = request.nextUrl.clone();
    const host = url.hostname;
    const protocol = url.protocol;
    const address = `${protocol}//${host}`;
    url.pathname = '/auth';

    if (extension !== 'unknown')
        return response;

    else if (isSEOBot) {
        const html = await middleware.createHTML(path, address);
        return new Response(html, {
            headers: {
                "content-type": "text/html;charset=UTF-8",
            },
        })
    }

    if (path === '/midIn') {
        const defDetails = await middleware.getApiKey();
        const {email, context, session, identifier} = userToken;
        const user = !valid ? null : {
            context: {
                email, session, role: context,
                identifier
            }
        };

        const details = {...defDetails, user};

        return new Response(JSON.stringify(details), {
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

    else if (!valid && !/\/api\/(auth|stream)/.test(path) && !/\/frame=|\/auth/.test(path))
        return NextResponse.redirect(url);

    else if (valid && path === '/auth') {
        if (request.redirect === 'follow')
            return response;

        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    return response;
}

export default async function (req: NextRequest) {
    return await verifyAccess(req, NextResponse.next())
}

