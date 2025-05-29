import { useCallback } from 'react';

import { sortBy, dedupeBy } from '@eleven-am/fp';

import { FrontImagesSchema, FrontImageSchema } from '@/api/data-contracts';
import { BaseButton } from '@/components/button';
import { BaseInput } from '@/components/input';
import { LazyImage } from '@/components/lazyImage';
import { TabsHolder } from '@/components/tabs';
import { tw } from '@/utils/style';

interface EditImagesProps {
    logo: string | null;
    poster: string | null;
    backdrop: string | null;
    portrait: string | null;
    images: FrontImagesSchema;
    setLogo: (logo: string) => void;
    setPoster: (poster: string) => void;
    setBackdrop: (backdrop: string) => void;
    setPortrait: (portrait: string) => void;
}

interface ImagePickerProps {
    current: string | null;
    images: FrontImageSchema[];
    onImageSelect: (image: string) => void;
}

enum ImageTypes {
    Backdrops = 'Backdrop',
    Posters = 'Poster',
    Logos = 'Logo',
    Portraits = 'Portrait',
}

function ImagePicker ({ images, onImageSelect, current }: ImagePickerProps) {
    const handleImageSelect = useCallback((image: FrontImageSchema) => () => onImageSelect(image.url), [onImageSelect]);

    return (
        <div className={'flex flex-col ml-4 flex-1 h-full justify-start overflow-hidden gap-y-2'}>
            <div className={'flex justify-between items-center h-1/4 w-full'}>
                {
                    current === null
                        ? <div className={'w-40 h-auto'} /> :
                        <LazyImage
                            src={current}
                            alt={'Current'}
                            className={tw('h-28 w-auto m-2 max-w-40 object-contain')}
                        />
                }
                <BaseInput
                    type={'text'}
                    placeholder={current || 'Select an Image'}
                    onChange={onImageSelect}
                    className={'text-sm bg-transparent text-lightest/100 placeholder:text-sm h-10 w-96'}
                />
            </div>
            {
                images.length > 0 ?
                    (
                        <div
                            className={'grid items-start grid-cols-4 mb-8 gap-4 flex-grow overflow-y-scroll scrollbar-hide'}
                        >
                            {
                                sortBy(dedupeBy(images, 'url'), ['drift', 'likes'], ['asc', 'desc'])
                                    .map((image) => (
                                        <BaseButton
                                            key={image.url}
                                            title={`${image.name} - ${image.year} (${image.source})`}
                                            onClick={handleImageSelect(image)}
                                        >
                                            <LazyImage
                                                src={image.url}
                                                alt={image.url}
                                                className={'w-40 h-auto cursor-pointer'}
                                            />
                                        </BaseButton>
                                    ))
                            }
                        </div>
                    )
                    : (
                        <div className={'flex border-2 border-lightest/10 rounded-md justify-center items-center mb-4 h-full w-full text-lightest/60'}>
                            No images found
                        </div>
                    )
            }
        </div>
    );
}

export function EditImages ({
    logo,
    poster,
    backdrop,
    portrait,
    images,
    setLogo,
    setPoster,
    setBackdrop,
    setPortrait,
}: EditImagesProps) {
    return (
        <div className={'flex flex-col items-start justify-center w-full h-full'}>
            <TabsHolder
                tabs={[ImageTypes.Backdrops, ImageTypes.Posters, ImageTypes.Logos, ImageTypes.Portraits]}
                activeLiClassName={'text-lightest/100'}
                liClassName={'text-lightest/60 hover:text-lightest/100'}
                holderClassName={'h-10 hidden ipadMini:flex items-center ipadMini:ml-4 ipadPro:ml-6 border-b-2 border-lightest/20'}
                ulClassName={'h-full text-lg font-medium gap-x-4'}
                wrapperClassName={'flex relative flex-col w-full h-full'}
                underlineClassName={'h-[2px] bg-lightest/100'}
                components={
                    [
                        {
                            activeWhen: [ImageTypes.Backdrops],
                            component: <ImagePicker images={images.backdrops} onImageSelect={setBackdrop} current={backdrop} />,
                        },
                        {
                            activeWhen: [ImageTypes.Posters],
                            component: <ImagePicker images={images.posters} onImageSelect={setPoster} current={poster} />,
                        },
                        {
                            activeWhen: [ImageTypes.Logos],
                            component: <ImagePicker images={images.logos} onImageSelect={setLogo} current={logo} />,
                        },
                        {
                            activeWhen: [ImageTypes.Portraits],
                            component: <ImagePicker images={images.portraits} onImageSelect={setPortrait} current={portrait} />,
                        },
                    ]
                }
            />
        </div>
    );
}
