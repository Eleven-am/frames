import { NetworkResponseSchema } from '@/api/data-contracts';
import { LazyImage } from '@/components/lazyImage';

interface PersonMobileProps {
    company: NetworkResponseSchema;
}

export function CompanyMobile ({ company }: PersonMobileProps) {
    return (
        <div className={'relative ipadMini:hidden w-full text-white'}>
            <div className={'relative pt-16 w-full flex flex-col justify-center items-center'}>
                <LazyImage
                    src={company.logo ?? ''}
                    alt={company.name}
                    className={'w-1/2 h-auto object-contain'}
                />
                <h1 className={'my-4 w-full text-center text-lg font-bold text-shadow-lg'}>
                    {company.name}
                </h1>
            </div>
        </div>
    );
}
