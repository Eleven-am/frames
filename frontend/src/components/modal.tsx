import { ReactNode, useRef, CSSProperties } from 'react';

import { Portal } from '@radix-ui/react-portal';
import { AnimatePresence, motion } from 'framer-motion';

import { useEventListener } from '@/hooks/useEventListener';


interface ModalProps {
    children: ReactNode;
    open: boolean;
    onClose: () => void;
    className?: string;
    style?: CSSProperties;
}

export function Modal ({ children, open, onClose, className, style }: ModalProps) {
    const outerModalRef = useRef<HTMLDivElement | null>(null);
    const innerModalRef = useRef<HTMLDivElement | null>(null);

    useEventListener('click', (e) => {
        if (outerModalRef.current &&
            innerModalRef.current &&
            (outerModalRef.current.contains(e.target as Node) &&
                !innerModalRef.current.contains(e.target as Node))
        ) {
            onClose();
        }
    });

    return (
        <AnimatePresence>
            {
                open && (
                    <Portal>
                        <div ref={outerModalRef}
                            className={'fixed w-full h-screen top-0 left-0 justify-center items-center backdrop-blur-md bg-darkD/5 flex'}
                            style={style}
                        >
                            <motion.div
                                ref={innerModalRef}
                                className={className}
                                initial={
                                    {
                                        opacity: 0,
                                        scale: 0.75,
                                    }
                                }
                                animate={
                                    {
                                        opacity: 1,
                                        scale: 1,
                                        transition: {
                                            ease: 'easeOut',
                                            duration: 0.15,
                                        },
                                    }
                                }
                                exit={
                                    {
                                        opacity: 0,
                                        scale: 0.75,
                                        transition: {
                                            ease: 'easeIn',
                                            duration: 0.15,
                                        },
                                    }
                                }
                            >
                                {children}
                            </motion.div>
                        </div>
                    </Portal>
                )
            }
        </AnimatePresence>
    );
}
