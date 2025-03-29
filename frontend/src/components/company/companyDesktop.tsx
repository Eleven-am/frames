import { NetworkResponseSchema } from '@/api/data-contracts';
import { LazyImage } from '@/components/lazyImage';

interface CompanyDesktopProps {
    company: NetworkResponseSchema;
}

export function CompanyDesktop ({ company }: CompanyDesktopProps) {
    return (
        <div className={'hidden ipadMini:block relative top-0 left-0 w-full'}>
            <div
                className={'relative justify-center items-center w-1/4 h-2/5 flex flex-col py-20 px-8 text-white'}
            >
                <LazyImage
                    className={'w-full h-auto object-contain'}
                    src={company.logo ?? ''}
                    alt={company.name}
                />
                <h1 className={'text-2xl fullHD:text-4xl mt-8 font-bold text-shadow-lg'}>
                    {company.name}
                </h1>
            </div>
        </div>
    );
}
