import { AnimatePresence, motion } from 'framer-motion';

import { Metadata } from '@/components/metadata';
import { usePlayerUI } from '@/providers/watched/playerUI';
import { tw } from '@/utils/style';


const variants = {
    enter: {
        opacity: 0,
        scale: 0.8,
        x: -100,
    },
    center: {
        opacity: 1,
        scale: 1,
        x: 0,
    },
    exit: {
        opacity: 0,
        scale: 0.8,
        x: -100,
    },
};

interface MediaInformationProps {
    name: string;
    overview: string;
    playbackId: string;
    episodeName: string | null;
    poster: string;
    episodeBackdrop: string | null;
    episodeOverview: string | null;
}

export function MediaInformation ({ name, overview, playbackId, episodeName, poster, episodeBackdrop, episodeOverview }: MediaInformationProps) {
    const displayInfo = usePlayerUI((state) => state.displayInfo);

    return (
        <div
            className={'fixed top-0 left-0 w-full h-full'}
        >
            <Metadata
                metadata={
                    {
                        name: episodeName ? `${name} - ${episodeName}` : name,
                        poster: episodeBackdrop ?? poster,
                        link: `/w=${playbackId}`,
                        overview,
                    }
                }
            />
            <AnimatePresence>
                {
                    displayInfo &&
                    (
                        <motion.div
                            initial={'enter'}
                            animate={'center'}
                            exit={'exit'}
                            variants={variants}
                            className="relative flex flex-col items-start justify-center w-full h-full p-8 space-y-6 bg-darkD/20"
                        >
                            <h1 className="text-6xl font-bold text-white text-left">{name}</h1>
                            <h2
                                className={
                                    tw('text-xl font-bold text-white text-left', {
                                        hidden: !episodeName,
                                    })
                                }
                            >
                                {episodeName}
                            </h2>
                            <p className="text-lg text-white text-left w-2/3 fullHD:w-1/2">
                                {episodeOverview ?? overview}
                            </p>
                        </motion.div>
                    )
                }
            </AnimatePresence>
        </div>
    );
}
