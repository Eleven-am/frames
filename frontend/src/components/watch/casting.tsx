import { LazyImage } from '@/components/lazyImage';
import { useCastSelector, Provider } from '@/providers/watched/castManager';
import { usePlayerUI } from '@/providers/watched/playerUI';

interface CastingProps {
    backdrop: string;
    name: string;
}

export function Casting ({ backdrop, name }: CastingProps) {
    const moveUp = usePlayerUI((state) => state.displayControls);

    const { casting, device } = useCastSelector((state) => ({
        casting: state.connected && state.provider === Provider.CHROMECAST,
        device: state.device,
    }));

    if (!casting) {
        return null;
    }

    return (
        <div
            className={'absolute w-full h-full top-0 left-0 flex justify-center items-center'}
        >
            <LazyImage
                src={backdrop}
                alt={name}
                loading={'eager'}
                className={'w-full h-full object-cover'}
            />
            <div
                className={'w-full h-full items-center justify-center fixed top-0 left-0 bg-darkD/40'}
            >
                <div
                    data-move-up={moveUp}
                    className={'absolute bottom-[10vh] data-[move-up="true"]:bottom-[22vh] flex items-center justify-start px-10 space-x-4 rounded-2xl w-1/2 transform transition-all ease-in-out duration-300'}
                >
                    <span>
                        <svg
                            viewBox={'0 0 24 24'}
                            className={'w-20 h-20 stroke-lightM stroke-2'}
                            fill={'none'}
                        >
                            <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
                            <line x1="2" y1="20" x2="2.01" y2="20" />
                        </svg>
                    </span>
                    <div
                        className={'flex flex-col space-y-2 text-lightest'}
                    >
                        <h1
                            className={'text-xl font-bold'}
                        >
                            Currently casting {name}
                        </h1>
                        <h3
                            className={'text-md'}
                        >
                            To {device}
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    );
}
