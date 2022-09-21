import React, {memo, useEffect, useRef, useState} from "react";
import Entity from "../singleEntity/entity";
import Editor from "../singleEntity/editor";
import styles from '../Sections.module.css';
import $ from "jquery";
import SectionDetails from "./sectiondetails";
import {SectionType} from "../../../../../server/classes/pickAndFrame";

function UnMemoEntities({response, type, section}: { response: any[], type: SectionType, section?: boolean }) {
    const [left, setLeft] = useState(false);
    const [right, setRight] = useState(true);
    const [position, setPosition] = useState(0);
    const entities = useRef<HTMLUListElement>(null);
    const val = type === 'EDITOR' ? 3 : 4;

    useEffect(() => {
        setLeft(false);
        setPosition(0);
        const children = entities.current ? entities.current.children : [];
        setRight(children.length > val);

        if (entities.current) {
            entities.current.style.overflow = 'scroll';
            entities.current.scrollLeft = 0;
            entities.current.style.overflow = 'hidden';
        }
    }, [entities, response])

    const scrollEntities = (direction: 'left' | 'right', dbl = false) => {
        let index: number;
        const children = entities.current ? entities.current.children : [];
        if (entities && entities.current && children.length) {
            if (entities.current) entities.current.style.overflow = 'scroll';

            if (direction === 'right') {
                index = dbl ? children.length - val : position + val;
                setLeft(true);
                setRight(index + val < children.length);
            } else if (direction === 'left') {
                index = dbl ? 0 : position - val;
                setRight(true)
                setLeft(index - val >= 0);
            } else index = 0;

            const element = $(entities.current);
            if (index < children.length && index >= 0) {
                if (index === 0)
                    element.animate({scrollLeft: 0}, 400);

                else if (index + val >= children.length) {
                    setPosition((children.length / val) * val);
                    if (type === 'BASIC')
                        element.animate({scrollLeft: entities.current.scrollWidth}, 400)

                    else if (type === 'SECTION')
                        element.animate({scrollLeft: entities.current.scrollWidth}, 400)

                    else
                        element.animate({scrollLeft: entities.current.scrollWidth}, 400)
                } else if (index + val < children.length)
                    if (type === 'BASIC')
                        element.animate({scrollLeft: (element.scrollLeft() || 0) + (direction === 'right' ? (1100 - 40) : -(1100 - 40))}, 400);

                    else if (type === 'SECTION')
                        element.animate({scrollLeft: (element.scrollLeft() || 0) + (direction === 'right' ? (1000 + 230) : -(1000 + 230))}, 400);

                    else
                        element.animate({scrollLeft: (element.scrollLeft() || 0) + (direction === 'right' ? (1500 - 450) : -(1500 - 450))}, 400);

                setPosition(index);
            }

            if (entities.current)
                entities.current.style.overflow = 'hidden';
        }
    }

    return (
        <div style={type === 'SECTION' ? {alignItems: "normal"} : {}} className={styles.sectionChevronListHolder}>
            <div style={type === 'SECTION' ? {marginTop: '50px'} : {}} onClick={() => scrollEntities('left')}
                 onDoubleClick={() => scrollEntities('left', true)}
                 className={left ? `${styles.activeChevron} ${styles.sectionChevronDiv} ${styles.leftChevron}` : `${styles.sectionChevronDiv} ${styles.leftChevron}`}>
                <svg viewBox="0 0 24 24" fill="none" className={styles.chevrons}>
                    <polyline points="15 18 9 12 15 6"/>
                </svg>
            </div>
            {type === 'SECTION' ? <SectionDetails response={response} entities={entities}/> :
                <div className={type === 'BASIC' ? styles.sectionList : styles.editorList}>
                    <ul style={section ? {margin: '0'} : {}}
                        className={type === 'BASIC' ? styles.sectionHolder : styles.editorHolder} ref={entities}>
                        {response.map(item => type === 'BASIC' ?
                            <Entity key={item.id} {...item}/> :
                            <Editor key={item.id} data={item}/>)}
                    </ul>
                </div>}
            <div style={type === 'SECTION' ? {marginTop: '50px'} : {}} onClick={() => scrollEntities('right')}
                 onDoubleClick={() => scrollEntities('right', true)}
                 className={right ? `${styles.sectionChevronDiv} ${styles.rightChevron} ${styles.activeChevron}` : `${styles.sectionChevronDiv} ${styles.rightChevron}`}>
                <svg viewBox="0 0 24 24" className={styles.chevrons}>
                    <polyline points="9 18 15 12 9 6"/>
                </svg>
            </div>
        </div>
    )
}

export default memo(UnMemoEntities);
