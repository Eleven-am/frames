import { LuUsers } from 'react-icons/lu';

import { BaseButton } from '@/components/button';
import { useNotificationState } from '@/providers/notificationChannel';
import { tw } from '@/utils/style';


interface UsersNotificationsProps {
    isMobile?: boolean;
}

export function UsersNotifications ({ isMobile }: UsersNotificationsProps) {
    const { tooltip, length } = useNotificationState((state) => {
        const length = state.users.length;

        if (length === 0) {
            return {
                tooltip: 'No users online',
                length,
            };
        }

        if (length === 1) {
            return {
                tooltip: '1 user online',
                length,
            };
        }

        return {
            tooltip: `${length} users online`,
            length,
        };
    });

    return (
        <BaseButton
            to={'/lobby'}
            title={tooltip}
            className={
                tw({
                    'ipadMini:hidden': isMobile,
                    'hidden ipadMini:flex': !isMobile,
                }, 'mr-6')
            }
            count={length}
        >
            <LuUsers className={'w-5 h-5 text-lightest'} strokeWidth={3} />
        </BaseButton>
    );
}
