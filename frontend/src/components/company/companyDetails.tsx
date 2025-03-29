import { NetworkResponseSchema, HomeResponseTypes } from '@/api/data-contracts';
import { HomeResponseList } from '@/components/index/homeResponseList';

interface CompanyDetailsProps {
    company: NetworkResponseSchema;
}

export function CompanyDetails ({ company }: CompanyDetailsProps) {
    return (
        <div
            className={'w-full flex flex-col justify-start items-start text-xl'}
        >
            <HomeResponseList
                data={
                    {
                        type: HomeResponseTypes.CLASSIC,
                        results: company.movies,
                        label: `Movies produced by ${company.name}`,
                        identifier: 'movies',
                    }
                }
            />
            <HomeResponseList
                data={
                    {
                        type: HomeResponseTypes.CLASSIC,
                        results: company.shows,
                        label: `Shows produced by ${company.name}`,
                        identifier: 'shows',
                    }
                }
            />
        </div>
    );
}
