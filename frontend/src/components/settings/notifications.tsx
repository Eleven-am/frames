import { BaseSection } from '@/components/settingsUI/baseSections';
import { Switch } from '@/components/switch';

export function Notifications () {
    return (
        <div className={'flex flex-col ipadMini:w-1/2 gap-y-8'}>
            <BaseSection
                label={'Notifications'}
                className={'shadow-black/50 shadow-md'}
                description={'If turned off, you will not receive group watch invitations even when you are online.'}
                settings={
                    [
                        {
                            label: 'Account and security',
                            rightElement: <Switch isSelected={true} onChange={console.log} />,
                        },
                        {
                            label: 'New content',
                            rightElement: <Switch isSelected={true} onChange={console.log} />,
                        },
                        {
                            label: 'Recommendations',
                            rightElement: <Switch isSelected={true} onChange={console.log} />,
                        },
                        {
                            label: 'Group watch invitations',
                            rightElement: <Switch isSelected={true} onChange={console.log} />,
                        },
                    ]
                }
            />
        </div>
    );
}
