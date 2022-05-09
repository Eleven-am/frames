import {atom, selector, useRecoilState, useRecoilValue, useResetRecoilState} from 'recoil';
import React, {useEffect, useRef} from "react";

export const pGraphAtom = atom<HTMLParagraphElement|null>({
    key: 'pGraphHomeAtom',
    default: null
})

export const imageAtom = atom<HTMLImageElement|null>({
    key: 'imageHomeAtom',
    default: null
})

export const sectionAtom = atom<number|undefined>({
    key: 'sectionHomeAtom',
    default: undefined
})

export const startHeight = atom<number|undefined>({
    key: 'startHomeAtom',
    default: undefined
})

export const OpacityHomeAtom = selector({
    key: 'opacityHomeAtom',
    get: ({get}) => {
        const value = get(sectionAtom);
        const start = get(startHeight);
        const pGraph = get(pGraphAtom);
        const image = get(imageAtom);

        if (start && value && pGraph && image){
            let holderOpacity = value === 1 || start === 1 ? 1 : (value - pGraph.getBoundingClientRect().bottom) / (start - pGraph.getBoundingClientRect().bottom);
            let imageOpacity = value === 1 || start === 1 ? 1 : (value - image.getBoundingClientRect().top) / (start - image.getBoundingClientRect().top);

            return {holderOpacity, imageOpacity}
        }

        return {holderOpacity: 1, imageOpacity: 1}
    }
})


export function useReset() {
    const pGraph = useResetRecoilState(pGraphAtom);
    const image = useResetRecoilState(imageAtom);
    const section = useResetRecoilState(sectionAtom);
    const sHeight = useResetRecoilState(startHeight);

    return () => {
        sHeight();
        section();
        image();
        pGraph();
    }
}
