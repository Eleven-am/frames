import { memo, useMemo, useState, useCallback } from 'react';

import { DetailedMediaSchema } from '@/api/data-contracts';
import { CarouselItem, CarouselImages } from '@/components/carousel';
import { FlatList } from '@/components/flatList';
import { PlayButton, TrailerButton } from '@/components/framesButtons';
import { GridList } from '@/components/gridList';
import { HorizontalDetails } from '@/components/HorizontalMediaDetials';
import { HoverElement } from '@/components/hoverElement';
import { LazyImage } from '@/components/lazyImage';
import { Portrait } from '@/components/listItem';
import { Player } from '@/components/player';
import { generateCompleteStyles } from '@/utils/colour';
import { tw } from '@/utils/style';


interface HorizontalRecommendationsProps {
    response: DetailedMediaSchema[];
}

const DesktopRecommendations = memo(({ response }: HorizontalRecommendationsProps) => {
    const [index, setIndex] = useState(0);

    const first = useMemo(() => response[index], [index, response]);

    const handleHover = useCallback((state: number) => (hover: boolean) => {
        if (hover) {
            setIndex(state);
        }
    }, []);

    return (
        <Player
            style={generateCompleteStyles(first.posterBlur, first.backdropBlur, first.logoBlur)}
            className={'top-0 left-0 w-full h-full fixed text-white'}
            name={first.name}
        >
            <LazyImage
                src={first.backdrop}
                alt={first.name}
                className={'fixed w-full h-full object-cover opacity-80'}
            />
            <div className={'fixed top-0 left-0 w-full h-full bg-gradient-to-t from-darkD to-transparent'} />
            <div className={'fixed flex items-center justify-center w-full h-full'}>
                <div className={'w-11/12 h-1/2 mt-40 flex items-center justify-center'}>
                    <div className={'w-1/3 h-full rounded-lg flex items-end justify-start'}>
                        <div
                            className={'w-11/12 h-full flex flex-col items-center justify-end'}
                        >
                            {
                                first.logo ?
                                    <LazyImage
                                        src={first.logo || ''}
                                        alt={first.name}
                                        className={'w-auto h-1/3 object-contain'}
                                    /> :
                                    <h1 className={tw('text-4xl ipadMini:text-2xl fullHD:text-5xl font-bold text-shadow-lg')}>
                                        {first.name}
                                    </h1>
                            }
                            <HorizontalDetails
                                className={'w-full flex flex-row mt-6 text-md items-center justify-center whitespace-nowrap'}
                                media={first}
                            />
                            <p className={'text-justify w-full ipadMini:text-sm fullHD:text-lg text-shadow-lg mt-4 line-clamp-4'}>{first.overview}</p>
                            <div className={'w-full flex items-center justify-center mt-4 gap-x-4'}>
                                <PlayButton type={first.type} name={first.name} mediaId={first.id} />
                                {first.trailer && <TrailerButton trailer={first.trailer} />}
                            </div>
                        </div>
                    </div>
                    <div className={'w-2/3 h-full rounded-lg flex items-end justify-start'}>
                        <FlatList
                            keyBoardNavigation
                            className={'items-end'}
                            options={
                                {
                                    skip: 1,
                                    noReset: true,
                                    currentIndex: index,
                                    handleCurrentIndex: setIndex,
                                }
                            }
                        >
                            {
                                response.map((item, i) => (
                                    <HoverElement
                                        key={item.id}
                                        element={'div'}
                                        onHover={handleHover(i)}
                                    >
                                        <Portrait
                                            liClassName={index === i ? 'fullHD:w-64 w-44' : undefined}
                                            {...item}
                                        />
                                    </HoverElement>
                                ))
                            }
                        </FlatList>
                    </div>
                </div>
            </div>
        </Player>
    );
});

const MobileRecommendations = memo(({ response }: HorizontalRecommendationsProps) => {
    const carousels: CarouselItem[] = response.map((item) => ({
        image: item.poster,
        blur: item.posterBlur,
        name: item.name,
    }));

    return (
        <div className={'w-full h-full relative text-white ipadMini:hidden py-16'}>
            <CarouselImages items={carousels} />
            <GridList
                items={response}
                ListComponent={({ data }) => <Portrait {...data} />}
            />
        </div>
    );
});

export const HorizontalRecommendations = memo(({ response }: HorizontalRecommendationsProps) => (
    <>
        <DesktopRecommendations response={response} />
        <MobileRecommendations response={response} />
    </>
));
