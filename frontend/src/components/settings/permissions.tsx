import { BaseSection } from '@/components/settingsUI/baseSections';

export function Permissions () {
    return (
        <div className={'flex flex-col ipadMini:w-1/2 gap-y-8'}>
            <BaseSection
                label={'Groups & Permissions'}
                className={'shadow-black/50 shadow-md'}
            />
        </div>
    );
}
