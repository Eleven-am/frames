import { ReactNode } from 'react';

import { PrimaryButton } from '@/components/button';
import { Modal } from '@/components/modal';
import { useBlurState } from '@/providers/blurProvider';
import { DialogState, useDialogState } from '@/providers/dialogStore';
import { createStyles } from '@/utils/colour';

interface DialogProps {
    action: DialogState;
    color: string;
}

function Dialog ({ action: { title, content, acceptAction, declineAction, onClose, open }, color }: DialogProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            style={createStyles(color)}
            className={'w-1/3 bg-dark-700/80 p-6 rounded-lg shadow-lg shadow-dark-800 flex flex-col gap-4'}
        >
            <h1 className={'text-3xl font-bold text-light-900'}>{title}</h1>
            <p className={'text-md line-clamp-4 text-light-900/80'}>{content}</p>
            <div className={'flex items-center gap-x-3 gap-y-2 justify-end'}>
                <PrimaryButton label={acceptAction.label} destructive={acceptAction.isDestructive} onClick={acceptAction.onClick} light={acceptAction.light ?? true} className={'py-2 px-4 rounded-md text-sm'}>
                    {acceptAction.icon}
                </PrimaryButton>
                <PrimaryButton label={declineAction.label} destructive={declineAction.isDestructive} onClick={declineAction.onClick} light={declineAction.light} className={'py-2 px-4 rounded-md text-sm'}>
                    {declineAction.icon}
                </PrimaryButton>
            </div>
        </Modal>
    );
}

export function DialogProvider ({ children }: { children: ReactNode }) {
    const dialogStates = useDialogState((state) => state.dialogs);
    const blur = useBlurState((state) => state.blur);

    return (
        <>
            {children}
            {
                dialogStates.map((dialog) => (
                    <Dialog key={dialog.id} action={dialog} color={blur} />
                ))
            }
        </>
    );
}
