import { useRef, useEffect } from 'react';

export function useTraceUpdate <T extends object> (component: string, props: T) {
    const prev = useRef(props);

    useEffect(() => {
        const changedProps = Object.entries(props).reduce((ps, [k, v]) => {
            if (prev.current[k] !== v) {
                ps[k] = [prev.current[k], v];
            }

            return ps;
        }, {
        });

        if (Object.keys(changedProps).length > 0) {
            console.log(`Changed props: [${component}]`, changedProps);
        }
        prev.current = props;
    });
}
