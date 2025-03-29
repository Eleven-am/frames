import { useMemo } from 'react';

import { useBuffering } from '@/providers/watched/playerPageStates';
import { usePlayerUI } from '@/providers/watched/playerUI';
import { tw } from '@/utils/style';


export function Buffering () {
    const loading = useBuffering();
    const blocked = usePlayerUI((state) => state.playbackBlocked);

    const isBuffering = useMemo(() => blocked ? false : loading, [loading, blocked]);

    return (
        <div
            className={
                tw('w-full h-full items-center justify-center absolute top-0 left-0 pointer-events-none, bg-darkD/40', {
                    flex: isBuffering,
                    hidden: !isBuffering,
                })
            }
        >
            <div className={'loader text-lightM'} />
        </div>
    );
}
