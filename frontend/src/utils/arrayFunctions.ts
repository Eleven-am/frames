export const findLastIndex = <DataType> (array: DataType[], predicate: (item: DataType) => boolean): number => {
    const reversed = array.concat().reverse();

    const index = reversed.findIndex(predicate);

    if (index === -1) {
        return -1;
    }

    return array.length - index - 1;
};

export const findIndexAndTransform = <DataType, ReturnType> (array: DataType[], predicate: (item: DataType) => boolean, transform: (index: number, arr: DataType[]) => ReturnType): ReturnType | undefined => {
    const index = array.findIndex(predicate);

    if (index === -1) {
        return undefined;
    }

    return transform(index, array);
};

