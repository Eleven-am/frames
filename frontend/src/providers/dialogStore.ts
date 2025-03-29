import { ReactNode } from 'react';

import { Notifier } from '@eleven-am/notifier';
import { uuid } from '@eleven-am/pondsocket-common';

export interface DialogButtonAction {
    label: string;
    onClick?: () => void;
    icon?: ReactNode;
    isDestructive?: boolean;
    light?: boolean;
}

interface ValidDialogButtonAction extends Omit<DialogButtonAction, 'onClick'> {
    onClick: () => void;
}

export interface DialogAction {
    title: string;
    content: string;
    acceptAction: DialogButtonAction;
    declineAction?: DialogButtonAction;
}

export interface DialogState extends Omit<DialogAction, 'acceptAction' | 'declineAction'> {
    id: string;
    open: boolean;
    onClose: () => void;
    acceptAction: ValidDialogButtonAction;
    declineAction: ValidDialogButtonAction;
}

interface DialogStoreState {
    dialogs: DialogState[];
}

class DialogStore extends Notifier<DialogStoreState> {
    constructor () {
        super({
            dialogs: [],
        });
    }

    createDialog (action: DialogAction) {
        const id = uuid();
        const declineAction = action.declineAction ?
            this.#wrapButtonAction(id, action.declineAction) :
            this.#createDeclineButtonAction(id);

        const acceptAction = this.#wrapButtonAction(id, action.acceptAction);
        const dialog: DialogState = {
            ...action,
            id,
            open: false,
            acceptAction,
            declineAction,
            onClose: this.#closeDialog.bind(this, id),
        };

        this.updateState({
            dialogs: [...this.state.dialogs, dialog],
        });

        this.#mapDialog(id, (dialog) => ({
            ...dialog,
            open: true,
        }));
    }

    #closeDialog (id: string) {
        this.#mapDialog(id, (dialog) => ({
            ...dialog,
            open: false,
        }));

        setTimeout(() => {
            this.updateState({
                dialogs: this.state.dialogs.filter((dialog) => dialog.id !== id),
            });
        }, 500);
    }

    #wrapButtonAction (id: string, action: DialogButtonAction) {
        const onClick = () => {
            action.onClick?.();
            this.#closeDialog(id);
        };

        const validAction: ValidDialogButtonAction = {
            ...action,
            onClick,
        };

        return validAction;
    }

    #createDeclineButtonAction (id: string) {
        return this.#wrapButtonAction(id, {
            label: 'Cancel',
            onClick: () => {
                // no op
            },
        });
    }

    #mapDialog (id: string, mapper: (dialog: DialogState) => DialogState) {
        this.updateState({
            dialogs: this.state.dialogs.map((dialog) => dialog.id === id
                ? mapper(dialog)
                : dialog),
        });
    }
}

const dialogStore = new DialogStore();

export const useDialogState = dialogStore.createStateHook();
export const useDialogActions = dialogStore.createActionsHook();

