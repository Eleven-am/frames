import {atom, DefaultValue, selector, useResetRecoilState} from "recoil";

export const GridTypeAtom = atom<string | null>({
    key: 'GridTypeAtom',
    default: null
})

export const GridValueAtom = atom<string | null>({
    key: 'GridValueAtom',
    default: null
})

export const GridSelector = selector<{ type: string, value: string } | null>({
    key: 'GridSelector',
    get: ({get}) => {
        const type = get(GridTypeAtom);
        const value = get(GridValueAtom);

        if (type === null || value === null)
            return null

        return {type, value}
    }, set: ({set}, newValue) => {
        if (!(newValue instanceof DefaultValue)) {
            if (newValue) {
                set(GridValueAtom, newValue.value);
                set(GridTypeAtom, newValue.type);
            }
        }
    }
})

export const useGridReset = () => {
    const type = useResetRecoilState(GridTypeAtom);
    const value = useResetRecoilState(GridValueAtom);

    return () => {
        type();
        value();
    }
}