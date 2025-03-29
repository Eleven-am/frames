import { useCallback, useMemo, useRef, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { motion, useScroll, useTransform } from 'framer-motion';

import { MediaType, PageResponseSlimMediaSchema } from '@/api/data-contracts';
import { InfiniteList } from '@/components/gridList';
import { MultiSelect, MultiSelectItem } from '@/components/multiSelect';
import { Dropdown } from '@/components/select';
import { useNavBarOpacity } from '@/hooks/useNavBarOpacity';
import { mediaQueries, mediaInfiniteQueries } from '@/queries/media';
import { tw } from '@/utils/style';


interface GenresAndDecadesPickersProps {
    genres: string[];
    decades: number[];
    type: MediaType;
    pageSize?: number;
    initialGrid: PageResponseSlimMediaSchema;
    bannerDisplayed: boolean;
    selected: string[];
    defaultDecade: number;
}

export function GenresAndDecadesPickers ({ genres, decades, type, bannerDisplayed, initialGrid, selected, defaultDecade }: GenresAndDecadesPickersProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [selectedGenres, setSelectedGenres] = useState<string[]>(selected);
    const { scrollYProgress } = useScroll({
        target: trackRef,
        offset: ['start end', 'end start'],
    });

    const navOpacity = useTransform(scrollYProgress, [0.2, 1], [0, 1]);
    const backgroundOpacity = useTransform(navOpacity, [0.79, 0.8, 1], [0, 0.8, 0.9]);
    const backgroundColor = useTransform(backgroundOpacity, (o) => `rgba(1, 16, 28, ${o})`);

    useNavBarOpacity(navOpacity);
    const decadeOptions = useMemo(() => {
        const defaultOption = {
            value: 0,
            label: 'Select a decade',
        };

        return [
            defaultOption,
            ...decades.map((decade) => ({
                value: decade,
                label: `${decade}s`,
            })),
        ];
    }, [decades]);

    const getDecade = useCallback(() => decadeOptions.find((option) => option.value === defaultDecade) || decadeOptions[0], [decadeOptions, defaultDecade]);
    const [decade, setDecade] = useState(getDecade());
    const { data: internalGenres } = useQuery(mediaQueries.genres(genres, selectedGenres, decade.value, type));

    const mappedMedia = useMemo<MultiSelectItem<string>[]>(() => (internalGenres!)
        .map((item) => ({
            id: item,
            label: item,
            value: item,
        })), [internalGenres]);

    const handleDecadeChange = useCallback((decade: number) => {
        setDecade({
            value: decade,
            label: `${decade}s`,
        });
    }, []);

    const handleGenreChange = useCallback((genre: MultiSelectItem) => {
        setSelectedGenres((prev) => {
            const set = new Set(prev);

            if (set.has(genre.id)) {
                set.delete(genre.id);
            } else {
                set.add(genre.id);
            }

            return [...set];
        });
    }, []);

    return (
        <>
            <motion.div
                className={
                    tw('top-12 w-full h-16 flex whitespace-nowrap items-center justify-center ipadMini:justify-start px-8 scrollbar-hide z-10', {
                        sticky: bannerDisplayed,
                        fixed: !bannerDisplayed,
                    })
                }
                style={
                    {
                        backgroundColor,
                    }
                }
            >
                <MultiSelect
                    items={mappedMedia}
                    selectedItems={selectedGenres}
                    handleItemSelected={handleGenreChange}
                    mobileLabel={'Select genres'}
                >
                    <Dropdown
                        value={decade}
                        options={decadeOptions}
                        onChange={handleDecadeChange}
                        svgClassName={'h-5 w-5 ml-2'}
                        selectClassName={'appearance-none focus:outline-none bg-transparent focus:ring-0'}
                        className={'mx-1 text-sm font-semibold text-lightL py-1 rounded-lg border border-lightD bg-darkD cursor-pointer transition-all duration-300 ease-in-out shadow-black shadow-sm data-[selected=true]:border-lightest data-[selected=true]:bg-darkM/70 data-[selected=true]:text-lightest hover:border-lightest hover:bg-darkM/70 hover:text-lightest hover:shadow-md hover:shadow-black relative flex items-center justify-center px-2'}
                    />
                </MultiSelect>
            </motion.div>
            <div ref={trackRef} className={'w-full h-1'} />
            <InfiniteList
                showLoader
                option={mediaInfiniteQueries.filter(type, decade.value, selectedGenres, initialGrid)}
                className={
                    tw({
                        'mt-32': !bannerDisplayed,
                    })
                }
            />
        </>
    );
}

