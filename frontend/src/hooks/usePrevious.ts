import { useRef, useEffect, useState } from 'react';

import { KeyOf, dedupeBy } from '@eleven-am/fp';

export function usePrevious<DataType> (value: DataType): DataType {
    const ref = useRef<DataType>(value);

    useEffect(() => {
        ref.current = value;
    });

    return ref.current;
}

export function usePreviousHistory<DataType> (value: DataType, keys: KeyOf<DataType> | KeyOf<DataType>[]): DataType[] {
    const [states, setStates] = useState<DataType[]>([]);

    useEffect(() => setStates((prev) => dedupeBy(prev.concat(value), keys)), [keys, value]);

    return states;
}
