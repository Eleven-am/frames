import ss from './Styles.module.css';
import styles from '../../grid/List.module.css';
import {useEffect, useRef, useState} from "react";
import {GenreHolderContextAtom, useDecadeContext, useGenreContext} from "../browseContext";
import useOnScroll from "../../../../utils/opacityScroll";
import {useRecoilValue} from "recoil";
import {BrowseData} from "../../../../../server/classes/media";

const useScroll = () => {
    const list = useRef<HTMLUListElement>();
    const [childIndex, setChildIndex] = useState(0);
    const [atLeft, setAtLeft] = useState(true);
    const [atRight, setAtRight] = useState(false);
    const scrollTimeout = useRef<NodeJS.Timeout>();

    const scrollLeft = () => {
        if (list.current && childIndex > 0) {
            scrollTimeout.current && clearTimeout(scrollTimeout.current);
            const newIndex = childIndex - 1;
            list.current.style.overflow = 'scroll';
            list.current.scrollTo(newIndex * list.current.clientWidth, 0);
            setChildIndex(newIndex);
            setAtRight(false);
            setAtLeft(newIndex === 0);
            scrollTimeout.current = setTimeout(() => {
                if (list.current)
                    list.current.style.overflow = 'hidden';
            }, 200);
        }
    }

    const scrollRight = () => {
        if (list.current && childIndex < list.current.children.length - 1) {
            scrollTimeout.current && clearTimeout(scrollTimeout.current);
            const newIndex = childIndex + 1;
            list.current.style.overflow = 'scroll';
            list.current.scrollTo(newIndex * list.current.clientWidth, 0);
            setChildIndex(newIndex);
            setAtLeft(false);
            setAtRight(list.current.scrollLeft + (list.current.clientWidth * 2) >= list.current.scrollWidth);
            scrollTimeout.current = setTimeout(() => {
                if (list.current)
                    list.current.style.overflow = 'hidden';
            }, 200);
        }
    }

    const setList = (outList: HTMLUListElement) => {
        list.current = outList;
    }

    return {scrollLeft, scrollRight, setList, atLeft, atRight};
}

export default function Selectors({data}: { data: BrowseData }) {
    const divRef = useRef<HTMLDivElement>(null);
    const genres = useRecoilValue(GenreHolderContextAtom);
    const {setReference} = useOnScroll();

    useEffect(() => {
        setReference(divRef.current);
    }, [divRef.current]);

    return (
        <div className={ss.cntr} ref={divRef}>
            <GenreHolder genres={genres.length ? genres : data.genres}/>
            <DecadeHolder decades={data.decades}/>
        </div>
    );
}

const GenreHolder = ({genres}: { genres: string[] }) => {
    const list = useRef<HTMLUListElement>(null);
    const {scrollLeft, scrollRight, setList, atLeft, atRight} = useScroll();
    const {manageGenre, isGenreSelected} = useGenreContext();

    useEffect(() => {
        list.current && setList(list.current);
    }, [list]);

    return (
        <div className={ss.list}>
            <svg style={{left: '-3%', display: atLeft ? 'none' : 'block'}} onClick={scrollLeft}>
                <polyline points="15 18 9 12 15 6"/>
            </svg>
            <ul className={styles.searchList} ref={list}>
                {genres.map(value => (
                    <li className={isGenreSelected(value) ? styles.activeList : styles.passiveList} key={value}
                        onClick={() => manageGenre(value)}>
                        {value}
                    </li>
                ))}
            </ul>
            <svg style={{right: '6%', display: atRight ? 'none' : 'block'}} onClick={scrollRight}>
                <polyline points="9 18 15 12 9 6"/>
            </svg>
        </div>
    )
}

const DecadeHolder = ({decades}: { decades: string[] }) => {
    const {manageDecade, decade} = useDecadeContext();

    return (
        <select className={ss.select}
                value={decade}
                onChange={e => manageDecade(e.currentTarget.value)}>
            <option value="">choose decade</option>
            {decades.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
    )
}