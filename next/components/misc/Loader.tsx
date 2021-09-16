import ss from './Loading.module.css';
import Link from "next/link";
import {ReactNode} from "react";
import useGroupWatch from "../../utils/groupWatch";
import {useWindowListener} from "../../utils/customHooks";
import useUser from "../../utils/userTools";
import {Role} from "@prisma/client";
import useCast from "../../utils/castContext";

export function Loading() {
    return (
        <div className={ss.bb1}>
            <div className={ss.bb2}>
                <div className={ss.circle}/>
                <div className={ss.circle}/>
            </div>
        </div>
    )
}

export function FramesLink({children, href, as}: { href: string, as?: string, children: ReactNode }) {
    return (
        <Link href={href} as={as}>
            <a className={ss.anchor}>
                {children}
            </a>
        </Link>
    )
}

export function BeforeExit() {
    const {user, signOut} = useUser();
    const {disconnect} = useGroupWatch();
    const {disconnect: castDisconnect} = useCast();
    useWindowListener('beforeunload', () => {
        disconnect();
        castDisconnect();
        user?.role === Role.GUEST && signOut();
    })

    return null;
}