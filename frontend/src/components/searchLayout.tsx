import { ReactNode, useCallback, useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { LevenshteinMatchSchema } from '@/api/data-contracts';
import { InfiniteList } from '@/components/gridList';
import { MultiSelect, MultiSelectItem } from '@/components/multiSelect';
import { useMediaLink } from '@/hooks/useMediaLink';
import { useNavbarState } from '@/providers/navbarProvider';
import { indexQueries, indexInfiniteQueries } from '@/queries';
import { tw } from '@/utils/style';


export function SearchLayout ({ children }: { children: ReactNode }) {
    const { search } = useNavbarState();
    const { navigateToLink } = useMediaLink();

    const handleItemClicked = useCallback((item: MultiSelectItem<LevenshteinMatchSchema>) => {
        navigateToLink({
            id: item.value.id,
            name: item.value.name,
            type: item.value.type,
        });
    }, [navigateToLink]);

    const { data: searchList } = useQuery(indexQueries.fuzzySearch(search));

    const mappedResults = useMemo(() => searchList
        .map((result) => ({
            id: result.id,
            label: result.name,
            value: result,
        }))
    , [searchList]);

    if (search.length === 0) {
        return (
            <>
                {children}
            </>
        );
    }

    return (
        <>
            <div className={'fixed top-12 w-full flex whitespace-nowrap items-center justify-start h-16 px-8 mt-2 scrollbar-hide z-10'}>
                <MultiSelect
                    items={mappedResults}
                    selectedItems={[]}
                    handleItemSelected={handleItemClicked}
                    mobileLabel={'Did you mean one of these?'}
                />
            </div>
            <InfiniteList
                showLoader
                option={indexInfiniteQueries.search(search)}
                className={
                    tw('mt-32', {
                        'mt-24': mappedResults.length === 0,
                    })
                }
            />
        </>
    );
}
