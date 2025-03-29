import { ReactNode } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { useMeasure } from '@/hooks/useResizeObserver';


interface ResizablePanelProps {
    children: ReactNode;
    keyId: string;
    className?: string;
}

export function ResizablePanel ({
    children,
    keyId,
    className,
}: ResizablePanelProps) {
    const [ref, { height }] = useMeasure<HTMLDivElement>();

    return (
        <motion.div
            animate={
                {
                    height: height || 'auto',
                }
            }
            className={'relative w-full mb-4 overflow-hidden'}
        >
            <AnimatePresence initial={false} mode={'wait'}>
                <motion.div key={keyId}>
                    <div ref={ref}
                        className={className}
                    >
                        {children}
                    </div>
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}
