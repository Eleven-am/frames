import { ReactNode, useCallback } from 'react';

import { Segment } from '@/components/settingsUI/segments';
import { tw } from '@/utils/style';

interface AddItemSettingsProps {
    label: string;
    startValue?: string;
    placeholder?: string;
    onCreate: (value: string) => void;
}

interface SingleSettingProps {
    label: string;
    onClick?: () => void;
    className?: string;
    isLast: boolean;
    hide?: boolean;
    rightElement?: ReactNode;
}

interface MultiSettingProps {
    label: string;
    children: ReactNode;
    className?: string;
}

export type SettingsItemProps = Omit<SingleSettingProps, 'isLast'>;

interface SettingsItemsProps {
    settings?: SettingsItemProps[];
    // multiSettings?: MultiSettingProps[];
    description?: string;
    className?: string;
    containerClassName?: string;
}

interface AddItemSettingsProps {
    label: string;
    startValue?: string;
    placeholder?: string;
    onCreate: (value: string) => void;
}

interface BaseSectionProps extends SettingsItemsProps {
    label?: string;
    addItem?: AddItemSettingsProps;
}

function SingleSetting ({ onClick, label, className, isLast, rightElement, hide = false }: SingleSettingProps) {
    const handleClick = useCallback(() => {
        if (onClick) {
            onClick();
        }
    }, [onClick]);

    if (hide === true) {
        return null;
    }

    return (
        <Segment isLast={isLast} className={tw('justify-between', className)} onClick={handleClick}>
            <span>{label}</span>
            {rightElement}
        </Segment>
    );
}

function MultiSetting ({ children, className, label }: MultiSettingProps) {
    const trimmedLabel = label.length > 55 ? `${label.slice(0, 55)}...` : label;

    return (
        <Segment.Container className={tw('mb-2', className)}>
            <Segment className={'justify-between'} isLast={false}>
                <h3 className={'fullHD:text-lg font-semibold line-clamp-1 text-nowrap'}>
                    {trimmedLabel}
                </h3>
            </Segment>
            <Segment className={'justify-between'} isLast={true}>
                {children}
            </Segment>
        </Segment.Container>
    );
}

function SettingsItems ({ settings, description, className, containerClassName }: SettingsItemsProps) {
    return (
        <Segment.FlexWrapper className={containerClassName}>
            <Segment.Container className={className}>
                {
                    (settings || []).map((setting, index) => (
                        <SingleSetting
                            {...setting}
                            key={setting.label}
                            isLast={index === settings!.length - 1}
                        />
                    ))
                }
            </Segment.Container>
            <Segment.Description description={description} />
        </Segment.FlexWrapper>
    );
}

export function BaseSection ({
    label,
    addItem,
    settings,
    description,
    className,
    containerClassName,
}: BaseSectionProps) {
    return (
        <Segment.Section>
            <Segment.Label label={label} />
            {
                addItem && (
                    <Segment.Input {...addItem} />
                )
            }
            <SettingsItems
                settings={settings}
                description={description}
                className={className}
                containerClassName={containerClassName}
            />
        </Segment.Section>
    );
}
