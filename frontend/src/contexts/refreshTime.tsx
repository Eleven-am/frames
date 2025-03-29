import { createContext, useContext, useState, ReactNode } from 'react';

const Context = createContext({
    key: '',
    updateRefreshTime: () => {},
});

export function useRefreshTime () {
    const context = useContext(Context);

    if (!context) {
        throw new Error('useRefreshTime must be used within a RefreshTimeProvider');
    }

    return context;
}

export function RefreshTimeProvider ({ children }: { children: ReactNode }) {
    const [refreshTime, setRefreshTime] = useState(0);

    return (
        <Context.Provider
            value={
                {
                    key: refreshTime.toString(),
                    updateRefreshTime: () => setRefreshTime(Date.now()),
                }
            }
        >
            {children}
        </Context.Provider>
    );
}
