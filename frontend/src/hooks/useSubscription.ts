import { useEffect } from 'react';

type UnSubscriber = () => void;

type Subscriber = () => UnSubscriber;

export const useSubscription = (subscriber: Subscriber) => {
    useEffect(() => {
        const unsubscribe = subscriber();

        return () => {
            unsubscribe();
        };
    }, [subscriber]);
};
