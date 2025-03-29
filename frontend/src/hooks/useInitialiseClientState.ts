import { useCallback, useEffect, useRef } from 'react';

export const useInitialiseClientState = <DataType> (handler: (state: DataType) => void, initialState: DataType): void => {
    const initialised = useRef(false);
    const savedHandler = useRef<(state: DataType) => void>(handler);

    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    const manageState = useCallback((data: DataType) => {
        if (!initialised.current) {
            initialised.current = true;
            savedHandler.current(data);
        }
    }, []);

    useEffect(() => manageState(initialState), [initialState, manageState]);
};
