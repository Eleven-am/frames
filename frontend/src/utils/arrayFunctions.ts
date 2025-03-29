type KeyOf<DataType> = keyof DataType;
type SortingOrder = 'asc' | 'desc';
type UniqueIdentifier = string | number;
export type ExtractPropertyNames<ObjectType, PrimitiveType> = {
    [Property in keyof ObjectType]: ObjectType[Property] extends PrimitiveType ? Property : never
}[keyof ObjectType]

export type ExtractSameValueType<FirstObject, SecondObject, Property extends keyof FirstObject> = ExtractPropertyNames<SecondObject, FirstObject[Property]>;

export function sortBy<DataType> (array: DataType[], keys: KeyOf<DataType> | KeyOf<DataType>[], order: SortingOrder | SortingOrder[]): DataType[] {
    const sortFields = Array.isArray(keys) ? keys : [keys];
    const ordersArray = Array.isArray(order) ? order : [order];

    return array.sort((a, b) => {
        let i = 0;

        while (i < sortFields.length) {
            if (ordersArray[i] === 'asc') {
                if (a[sortFields[i]] < b[sortFields[i]]) {
                    return -1;
                }
                if (a[sortFields[i]] > b[sortFields[i]]) {
                    return 1;
                }
            } else {
                if (a[sortFields[i]] < b[sortFields[i]]) {
                    return 1;
                }
                if (a[sortFields[i]] > b[sortFields[i]]) {
                    return -1;
                }
            }
            i++;
        }

        return 0;
    });
}

export function dedupeBy<DataType> (array: DataType[], keys: KeyOf<DataType> | KeyOf<DataType>[]): DataType[] {
    const dedupeFields = Array.isArray(keys) ? keys : [keys];

    return array.filter((thing, index, self) => index === self.findIndex((t) => (
        dedupeFields.every((field) => t[field] === thing[field])
    )));
}

export function sameOrder<ID extends UniqueIdentifier, DataType> (ids: ID[], array: DataType[], key: ExtractPropertyNames<DataType, ID>): DataType[] {
    const temp = array.concat();

    function isDefined (item: DataType | undefined): item is DataType {
        return item !== undefined;
    }

    return ids.map((id) => temp.find((item) => item[key] === id)).filter(isDefined);
}

export function intersect<FirstObject, SecondObject, Key extends KeyOf<FirstObject>, Key2 extends KeyOf<SecondObject>> (arr: FirstObject[], arr2: SecondObject[], keyA: Key | Key[], keyB: ExtractSameValueType<FirstObject, SecondObject, Key> | ExtractSameValueType<FirstObject, SecondObject, Key>[], keepKeys: Key2 | Key2[], takeMissing = false): Array<FirstObject & Pick<SecondObject, Key2>> {
    const a: any[] = arr.concat();
    const b: any[] = arr2.concat();
    const c: (FirstObject & Pick<SecondObject, Key2>)[] = [];

    const keysA = Array.isArray(keyA) ? keyA : [keyA];
    const keysB = Array.isArray(keyB) ? keyB : [keyB];
    const keptKeys = Array.isArray(keepKeys) ? keepKeys : [keepKeys];

    for (let i = 0; i < a.length; ++i) {
        const item = b.find((item) => keysA.every((key, index) => a[i][key] === item[keysB[index]]));

        if (item) {
            if (keptKeys.length > 0) {
                const obj = {
                    ...a[i],
                };

                keptKeys.forEach((key) => obj[key] = item[key]);
                c.push(obj);
            } else {
                c.push(a[i]);
            }
        } else if (takeMissing) {
            c.push(a[i]);
        }
    }

    return c;
}

export function difference<FirstObject, SecondObject, Key extends KeyOf<FirstObject>> (arr: FirstObject[], arr2: SecondObject[], keyA: Key, keyB: ExtractSameValueType<FirstObject, SecondObject, Key>): Array<FirstObject> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a: any[] = arr.concat();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b: any[] = arr2.concat();
    const c: FirstObject[] = [];

    for (let i = 0; i < a.length; ++i) {
        const item = b.find((item) => a[i][keyA] === item[keyB]);

        if (!item) {
            c.push(a[i]);
        }
    }

    return c;
}

export function groupBy<Key extends KeyOf<DataType>, DataType> (array: DataType[], key: Key): {key: DataType[Key], values: DataType[]}[] {
    const result: {key: DataType[Key], values: DataType[]}[] = [];

    array.forEach((item) => {
        const group = result.find((group) => group.key === item[key]);

        if (group) {
            group.values.push(item);
        } else {
            result.push({
                key: item[key],
                values: [item],
            });
        }
    });

    return result;
}

export function shuffle<DataType> (array: DataType[], length?: number): DataType[] {
    const temp = [];
    const minLength = Math.min(length ?? (array.length - 1), (array.length - 1));
    let index = 0;

    while (index <= minLength) {
        const random = Math.floor(Math.random() * array.length);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        temp.push(array[random]);
        array.splice(random, 1);
        index++;
    }

    return temp;
}

export function findLeastInferior<DataType, Key extends KeyOf<DataType>> (array: DataType[], key: Key, value: DataType[Key], maxValue: DataType[Key]): DataType | undefined {
    const index = array.findIndex((item) => item[key] > value);

    if (index !== -1) {
        return array[index - 1];
    }

    if (array.length < 1) {
        return undefined;
    }

    const lastItem = array[array.length - 1];

    if (lastItem[key] === maxValue) {
        return lastItem;
    }

    return undefined;
}

export const findLastItem = <DataType> (array: DataType[], predicate: (item: DataType) => boolean): DataType | undefined => {
    const reversed = array.concat().reverse();

    return reversed.find(predicate);
};

export const findLastIndex = <DataType> (array: DataType[], predicate: (item: DataType) => boolean): number => {
    const reversed = array.concat().reverse();

    const index = reversed.findIndex(predicate);

    if (index === -1) {
        return -1;
    }

    return array.length - index - 1;
};

export const findAndTransform = <DataType, ReturnType> (array: DataType[], predicate: (item: DataType) => boolean, transform: (item: DataType, arr: DataType[]) => ReturnType): ReturnType | undefined => {
    const item = array.find(predicate);

    if (!item) {
        return undefined;
    }

    return transform(item, array);
};

export const findIndexAndTransform = <DataType, ReturnType> (array: DataType[], predicate: (item: DataType) => boolean, transform: (index: number, arr: DataType[]) => ReturnType): ReturnType | undefined => {
    const index = array.findIndex(predicate);

    if (index === -1) {
        return undefined;
    }

    return transform(index, array);
};

export const pickFrom = <FirstObject, SecondObject, Key extends KeyOf<FirstObject>, Key2 extends KeyOf<SecondObject>> (array: FirstObject[], secondArray: SecondObject[], key: Key, secondKey: ExtractSameValueType<FirstObject, SecondObject, Key>, pick: Key2 | Key2[]): Array<FirstObject & Pick<SecondObject, Key2>> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const temp: any[] = array.concat();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const temp2: any[] = secondArray.concat();
    const pickedKeys = Array.isArray(pick) ? pick : [pick];

    return temp.map((item) => {
        const secondItem = temp2.find((i) => i[secondKey] === item[key]);

        if (!secondItem) {
            return item;
        }

        const obj = {
            ...item,
        };

        pickedKeys.forEach((k) => {
            obj[k] = secondItem[k];
        });

        return obj;
    });
};
