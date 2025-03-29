import { useCallback, useState } from 'react';

export function App () {
    const [state, setState] = useState(0);

    const increment = useCallback(() => setState((prev) => prev + 1), []);
    const decrement = useCallback(() => setState((prev) => prev - 1), []);

    return (
        <div>
            <h1>Hello World</h1>
            <p>{state}</p>
            <button onClick={increment}>Increment</button>
            <button onClick={decrement}>Decrement</button>
        </div>
    );
}