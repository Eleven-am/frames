import { BaseSection } from '@/components/settingsUI/baseSections';

export function Frames () {
    return (
        <div className={'flex flex-col ipadMini:w-1/2 gap-y-8'}>
            <BaseSection
                label={'Frames settings'}
                className={'shadow-black/50 shadow-md'}
            />
        </div>
    );
}
