import GridEntity from "../../entities/singleEntity/gridEntity";
import React, {useRef} from "react";
import {MediaContextAtom} from "../browseContext";
import style from "./Style.module.css";
import useOnScroll from "../../../../utils/opacityScroll";
import {useRecoilValue} from "recoil";

export default function Grid() {
    const data = useRecoilValue(MediaContextAtom);
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const {navDark} = useOnScroll();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"})
    }

    return (
        <>
            <div className={style.bck} style={navDark ? {display: "block"} : {}}/>
            <div className={style.gridHolder}>
                {data.map(item =>
                    <GridEntity key={item.id} {...item} />
                )}
            </div>
        </>
    )
}
