import {atom, selector, useRecoilState, useRecoilValue, useResetRecoilState, useSetRecoilState} from "recoil";
import {useEffect} from "react";
import {NavOpacityAtom} from "../states/navigation";

const OnScrollReference = atom<Element | null>({
    key: 'OnScrollReference',
    default: null
})

const CurrentRefHeight = atom<number | undefined>({
    key: 'CurrentRefHeight',
    default: undefined
})

const StartRefHeight = atom<number | undefined>({
    key: 'StartRefHeight',
    default: undefined
})

const OpacitySelector = selector({
    key: 'OpacitySelector',
    get: ({get}) => {
        const start = get(StartRefHeight);
        const current = get(CurrentRefHeight);
        if (start && current) {
            let height = 1 - ((current / start) - 0.3);
            let lowOpacity = height - 0.3;
            return {height, lowOpacity};
        }

        return {height: 0.25, lowOpacity: 0};
    }
})

export default function useOnScroll() {
    const [reference, setReference] = useRecoilState(OnScrollReference);
    const setStart = useSetRecoilState(StartRefHeight);
    const setCurrent = useSetRecoilState(CurrentRefHeight);
    const values = useRecoilValue(OpacitySelector);
    const setNavOpacity = useSetRecoilState(NavOpacityAtom);

    const refReset = useResetRecoilState(OnScrollReference);
    const currentReset = useResetRecoilState(CurrentRefHeight);
    const startRefReset = useResetRecoilState(StartRefHeight);

    const onScroll = () => {
        const currentHeight = reference?.getBoundingClientRect().top;
        setCurrent(currentHeight);
    }

    useEffect(() => {
        setNavOpacity((values.height < 0.5 ? 1.3: 0.9) - values.height);
    }, [values])

    const reset = () => {
        refReset();
        currentReset();
        startRefReset();
    }

    useEffect(() => {
        const height = reference?.getBoundingClientRect().top;
        setStart(height);
    }, [reference])

    return {reset, values, setReference, onScroll};
}
