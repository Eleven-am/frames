import { useRef, useState, SetStateAction, Dispatch, useCallback } from 'react';

import { storage } from '@/utils/storage';

export function useLocalStorage <Data> (key: string, defaultValue: Data): [Data, Dispatch<SetStateAction<Data>>] {
    const storageRef = useRef(storage(key, defaultValue));
    const [state, setState] = useState(storageRef.current.get());

    const handleSetState: Dispatch<SetStateAction<Data>> = useCallback((action) => {
        if (typeof action === 'function') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            const state = action(storageRef.current.get());

            storageRef.current.set(state);
            setState(state);
        } else {
            storageRef.current.set(action);
            setState(action);
        }
    }, []);

    return [state, handleSetState];
}
