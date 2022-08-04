import React, {ReactNode} from "react";
import {atomFamily, useRecoilValue} from "recoil";
import sss from "../lobby/GroupWatch.module.css";

export const SideBarAtomFamily = atomFamily<boolean, string>({
    key: 'SideBarAtomFamily',
    default: false
})

export const SideBar = ({
                            children,
                            topic,
                            atomName,
                            close
                        }: { children: ReactNode, atomName: string, topic: string, close: () => void }) => {
    const visible = useRecoilValue(SideBarAtomFamily(atomName));

    return (
        <div className={sss.sdbr} style={visible ? {right: 0} : {}}>
            <div className={sss.hdr}>
                <div>{topic}</div>
                <svg viewBox="0 0 24 24" onClick={close} style={{cursor: 'pointer'}}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
            </div>
            {children}
        </div>
    )
}