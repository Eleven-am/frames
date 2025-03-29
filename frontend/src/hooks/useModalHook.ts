import { useCallback, useState } from 'react';

export interface ModalHook {
    isOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
}

export function useModalHook (): ModalHook {
    const [isOpen, setIsOpen] = useState(false);

    const openModal = useCallback(() => setIsOpen(true), []);
    const closeModal = useCallback(() => setIsOpen(false), []);

    return {
        isOpen,
        openModal,
        closeModal,
    };
}
