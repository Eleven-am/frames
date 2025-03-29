import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { CarouselImages } from '@/components/carousel';
import { SetupProcess, useSetupState } from '@/providers/setupProvider';
import { setupQueries } from '@/queries/setup';


export function SetupCarousel () {
    const sequence = useSetupState((state) => !state.processSequence.includes(SetupProcess.TmDBForm) && state.process !== SetupProcess.TmDBForm);
    const { data } = useQuery(setupQueries.carousel(sequence));

    const mappedData = useMemo(() => data
        .map((item) => ({
            image: item,
            blur: '',
            name: '',
        })), [data]);

    return (
        <CarouselImages items={mappedData} />
    );
}
