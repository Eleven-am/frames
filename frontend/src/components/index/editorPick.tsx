import { useSuspenseQuery } from '@tanstack/react-query';

import { LazyImage } from '@/components/lazyImage';
import { MediaLink } from '@/components/listItem';
import { listQueries } from '@/queries/list';
import { createStyles } from '@/utils/colour';

// TODO: This is intended to showcase what ads would look like on the home screen
export function EditorPick () {
    const { data } = useSuspenseQuery(listQueries.myList);
    const banner = data.results[0];

    if (!banner) {
        return null;
    }

    return (
        <MediaLink
            id={banner.id}
            type={banner.type}
            name={banner.name}
            className={'group relative w-full flex justify-center items-center px-8 mt-4 mb-10'}
        >
            <div
                style={createStyles(banner.backdropBlur)}
                className={'relative w-full h-[60vh] cursor-pointer stroke-light-600 bg-dark-700 rounded-2xl overflow-hidden flex items-center shadow-black shadow-md hover:shadow-black hover:shadow-lg hover:border-lightest hover:border-2 transition-all duration-300 ease-in-out'}
            >
                <LazyImage
                    src={banner.backdrop}
                    alt={banner.name}
                    className={'absolute w-3/4 h-full object-cover right-0 top-0'}
                />
                <div
                    className={'absolute w-full h-full top-0 left-0'}
                    style={
                        {
                            background: `linear-gradient(to right, rgba(var(--dark-700), 1) 32%, rgba(var(--dark-700), .8) 42%, rgba(var(--dark-700), .2) 55%, rgba(var(--dark-700), 0)),
        linear-gradient(45deg, rgba(var(--dark-700), 1) 15%, rgba(var(--dark-700), .2) 50%, rgba(var(--dark-700), 0)),
        linear-gradient(135deg, rgba(var(--dark-700), 1) 15%, rgba(var(--dark-700), .2) 50%, rgba(var(--dark-700), 0))`,
                        }
                    }
                />
                <div
                    className={'h-full w-2/5 absolute top-0 left-0 flex justify-center items-center'}
                >
                    <LazyImage
                        src={banner.portrait}
                        alt={banner.name}
                        className={'w-2/5 shadow-md shadow-black object-contain overflow-hidden rounded-lg group-hover:scale-105 group-hover:shadow-black group-hover:shadow-lg transition-all duration-300 ease-in-out'}
                    />
                </div>
            </div>
        </MediaLink>
    );
}
