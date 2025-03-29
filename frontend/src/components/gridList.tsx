import { SlimMediaSchema } from '@/api/data-contracts';
import { Portrait, LargeRecommendation } from '@/components/listItem';
import { Loading } from '@/components/loading-set/Loading';
import { responsive } from '@/components/responsive';
import { tw } from '@/utils/style';
import { useIsVisible, useInfiniteScroll } from '@eleven-am/xquery';
import { UseInfiniteScrollOptions } from '@eleven-am/xquery/types';
import { FC, CSSProperties, Ref, ReactNode } from 'react';


interface Id {
    id: string;
}

interface ListProps {
    options?: IntersectionObserverInit;
    onEndReached?: () => void;
    children: ReactNode;
    className?: string;
}

interface GridListProps<DataType extends Id> {
    items: DataType[];
    className?: string;
    ulClassName?: string;
    style?: CSSProperties;
    showLoader?: boolean;
    plugLastElement?: Ref<HTMLDivElement>;
    ListComponent: FC<{ data: DataType }>;
}

interface InfiniteListProps {
    style?: CSSProperties;
    ulClassName?: string;
    showLoader?: boolean;
    className?: string;
    option: UseInfiniteScrollOptions<SlimMediaSchema>;
}


export const Component = responsive<SlimMediaSchema>({
    Mobile: ({ data }) => <Portrait
        portrait={data.portrait}
        type={data.type}
        posterBlur={data.posterBlur}
        name={data.name}
        id={data.id}
    />,
    Desktop: ({ data }) => <LargeRecommendation
        backdrop={data.backdrop}
        type={data.type}
        logoBlur={data.logoBlur}
        logo={data.logo}
        backdropBlur={data.backdropBlur}
        name={data.name}
        id={data.id}
    />,
});

export function List ({ onEndReached, children, options }: ListProps) {
    const [ref] = useIsVisible({
        action: onEndReached,
        options,
    });

    return (
        <>
            {children}
            <div ref={ref} className={'w-full h-2'} />
        </>
    );
}

export function GridList<DataType extends Id> (props: GridListProps<DataType>) {
    const { items, plugLastElement, ListComponent, className, style, showLoader, ulClassName } = props;

    if (items.length === 0 && showLoader) {
        return <Loading />;
    }

    return (
        <div className={tw('w-full flex flex-col items-center', className)} style={style}>
            <ul className={tw('grid grid-cols-2 ipadMini:grid-cols-3 macbook:grid-cols-4 fullHD:grid-cols-5 scrollbar-hide gap-5 p-2', ulClassName)}>
                {items.map((item) => <ListComponent data={item} key={item.id} />)}
            </ul>
            <div ref={plugLastElement} className={'w-full h-2'} />
        </div>
    );
}

export function InfiniteList ({ option, className, showLoader, style, ulClassName }: InfiniteListProps) {
    const [items, ref] = useInfiniteScroll(option);

    return (
        <GridList
            items={items}
            showLoader={showLoader}
            plugLastElement={ref}
            ListComponent={Component}
            ulClassName={ulClassName}
            className={className}
            style={style}
        />
    );
}
