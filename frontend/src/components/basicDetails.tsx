import { useMemo } from 'react';

import { dedupeBy } from '@eleven-am/fp';

import { HomeResponseSlimMediaSchema } from '@/api/data-contracts';
import { CarouselImages } from '@/components/carousel';
import { ExpandingText } from '@/components/expandingText';
import { HomeResponseList } from '@/components/index/homeResponseList';
import { LazyImage } from '@/components/lazyImage';
import { Metadata } from '@/components/metadata';

interface BasicDetailsProps {
    photo: string;
    name: string;
    description: string;
    link: string;
}

interface PageDetailsProps extends BasicDetailsProps {
    sections: HomeResponseSlimMediaSchema[];
}

function BasicDetailsMobile ({ photo, name, description }: Omit<BasicDetailsProps, 'link'>) {
    return (
        <div className={'relative ipadMini:hidden text-white pt-16 w-full flex flex-col justify-center items-center'}>
            <LazyImage
                src={photo}
                alt={name}
                className={'w-1/3 h-auto object-cover aspect-square border-lightest border-2 rounded-full shadow-black/50 shadow-xl'}
            />
            <h1 className={'mt-4 w-full text-center text-4xl font-bold text-shadow-lg'}>
                {name}
            </h1>
            <ExpandingText
                lines={4}
                text={description}
                className={'px-4 mt-4 w-full text-md text-white/70'}
                expandedClassName={'p-0 text-justify pb-4'}
                collapsedClassName={'p-0 text-justify line-clamp-4 pb-4'}
            />
        </div>
    );
}

function BasicDetailsDesktop ({ photo, name, description }: Omit<BasicDetailsProps, 'link'>) {
    return (
        <div className={'hidden ipadMini:block relative top-0 left-0 w-full h-4/5'}>
            <div
                className={'w-full h-full flex py-20 px-8 fullHD:px-16 text-white'}
            >
                <div
                    className={'relative flex justify-center items-center w-1/4 h-full'}
                >
                    <LazyImage
                        className={'w-full h-auto object-contain border-lightest border-2 rounded-lg shadow-black/50 shadow-xl'}
                        src={photo}
                        alt={name}
                    />
                </div>
                <div className={'flex flex-col justify-start w-3/4 ml-8 h-full'}>
                    <div className={'h-1/4 w-full flex items-center'}>
                        <h1 className={'text-5xl fullHD:text-7xl font-bold text-shadow-lg'}>
                            {name}
                        </h1>
                    </div>
                    <ExpandingText
                        lines={4}
                        text={description}
                        expandedClassName={''}
                        collapsedClassName={'line-clamp-4'}
                        className={'w-full flex flex-col justify-start items-start pt-8 text-md fullHD:text-xl'}
                    />
                </div>
            </div>
        </div>
    );
}

export function BasicDetails ({ photo, name, description, sections, link }: PageDetailsProps) {
    const carousels = useMemo(() => dedupeBy(sections.flatMap((section) => section.results.map((item) => ({
        image: item.poster,
        blur: item.posterBlur,
        name: item.name,
    }))), 'image'), [sections]);

    return (
        <>
            <Metadata
                metadata={
                    {
                        overview: description,
                        poster: photo,
                        link,
                        name,
                    }
                }
            />
            <CarouselImages items={carousels} className={'opacity-20'} />
            <BasicDetailsDesktop photo={photo} name={name} description={description} />
            <BasicDetailsMobile photo={photo} name={name} description={description} />
            <div
                className={'w-full flex flex-col justify-start items-start text-xl'}
            >
                {sections.map((section) => <HomeResponseList key={section.identifier} data={section} />)}
            </div>
        </>
    );
}
