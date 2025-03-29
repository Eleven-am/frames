import { useCallback, FormEvent, useState, useEffect } from 'react';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { SubmitButton } from '@/components/auth/buttons';
import { PasswordInput } from '@/components/auth/inputs';
import { TransformingInput } from '@/components/input';
import { Modal } from '@/components/modal';
import { FramesSelect } from '@/components/select';
import { BaseSection } from '@/components/settingsUI/baseSections';
import { Switch } from '@/components/switch';
import { useEventListener } from '@/hooks/useEventListener';
import { useModalHook } from '@/hooks/useModalHook';
import { useAuthStore } from '@/providers/authStore';
import { useDialogActions } from '@/providers/dialogStore';
import { useUserActions } from '@/providers/userProvider';
import { profileQueries, profileMutations } from '@/queries/settings/profile';


function ForgotPassword () {
    const { error, password } = useAuthStore((state) => state.password);
    const token = useAuthStore((state) => state.misc.token);
    const { resetPassword } = useUserActions();

    const handleForgotPassword = useCallback(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (error) {
            return;
        }

        await resetPassword(password, token);
    }, [error, resetPassword, password, token]);

    useEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            await handleForgotPassword(e as unknown as FormEvent<HTMLFormElement>);
        }
    });

    return (
        <form
            className={'m-0 w-full px-4'}
            onSubmit={handleForgotPassword}
        >
            <PasswordInput
                name={'password'}
                placeholder={'enter your password'}
            />
            <PasswordInput
                confirmPassword
                name={'password_confirmation'}
                placeholder={'confirm your password'}
            />
            <div className={'relative'}>
                <SubmitButton
                    label={'update Password'}
                    tooltip={'update your password'}
                />
            </div>
        </form>
    );
}

export function Profile () {
    const modalHook = useModalHook();
    const queryClient = useQueryClient();
    const { createDialog } = useDialogActions();
    const { updateUser: modifyUser } = useUserActions();
    const { data: user } = useQuery(profileQueries.details);
    const [username, setUsername] = useState('');

    const { mutate: updateUsername } = useMutation({
        ...profileMutations.username,
        onError: () => setUsername(user?.username || ''),
    });

    const updateUser = useCallback(async (...data: Parameters<typeof modifyUser>) => {
        await modifyUser(...data);
        await queryClient.invalidateQueries({
            queryKey: profileQueries.details.queryKey,
        });
    }, [modifyUser, queryClient]);

    const deleteUser = useCallback(() => {
        createDialog({
            title: 'Delete Account',
            content: 'Are you sure you want to delete your account, all of your data will be lost?',
            acceptAction: {
                label: 'Decline',
            },
            declineAction: {
                label: 'Accept',
                isDestructive: true,
                onClick: () => console.log('Delete Account'),
            },
        });
    }, [createDialog]);

    const setIncognito = useCallback((value: boolean) => updateUser({
        incognito: value,
    }), [updateUser]);

    const setInform = useCallback((value: boolean) => updateUser({
        inform: value,
    }), [updateUser]);

    const setAutoPlay = useCallback((value: boolean) => updateUser({
        autoplay: value,
    }), [updateUser]);

    const setLanguage = useCallback((value: string) => updateUser({
        language: value,
    }), [updateUser]);

    useEffect(() => {
        if (user?.username) {
            setUsername(user.username);
        }
    }, [user?.username]);

    if (!user) {
        return null;
    }

    return (
        <div className={'flex flex-col w-full ipadMini:w-1/2 gap-y-8'}>
            <BaseSection
                label={'Profile'}
                className={'shadow-black/50 shadow-md'}
                settings={
                    [
                        {
                            label: 'Username',
                            rightElement: <TransformingInput
                                iconClassName={'text-lightest/50 ml-1 w-3 h-3'}
                                onBlur={updateUsername}
                                onChange={setUsername}
                                element={'input'}
                                value={username}
                            />,
                        },
                        {
                            label: 'Email',
                            rightElement: <span>{user.email}</span>,
                        },
                        {
                            label: 'Password',
                            onClick: modalHook.openModal,
                            className: 'cursor-pointer',
                            rightElement: <span>********</span>,
                        },
                        {
                            label: 'Language',
                            rightElement: (
                                <FramesSelect
                                    value={user.language}
                                    onChange={setLanguage}
                                    options={user.availableLanguages}
                                />
                            ),
                        },
                    ]
                }
            />
            <BaseSection
                className={'shadow-black/50 shadow-md'}
                description={'Enabling incognito will make you invisible to other users. This makes it impossible for you to create or join group watch sessions.'}
                settings={
                    [
                        {
                            label: 'Auto Play',
                            rightElement: <Switch isSelected={user.autoplay}
                                isDisabled={user.incognito}
                                onChange={setAutoPlay}
                            />,
                        },
                        {
                            label: 'Save playback history',
                            rightElement: <Switch isSelected={user.inform}
                                isDisabled={user.incognito}
                                onChange={setInform}
                            />,
                        },
                        {
                            label: 'Incognito Mode',
                            rightElement: <Switch isSelected={user.incognito} onChange={setIncognito} />,
                        },
                    ]
                }
            />
            <BaseSection
                className={'shadow-black/50 shadow-md'}
                settings={
                    [
                        {
                            label: 'Block a user',
                            onClick: console.log,
                        },
                        {
                            label: 'Manage blocked users',
                            onClick: console.log,
                        },
                    ]
                }
            />
            <BaseSection
                className={'shadow-black/50 shadow-md'}
                description={'Delete your account and all of your data. This action is irreversible, please be certain before proceeding.'}
                settings={
                    [
                        {
                            label: 'Delete Account',
                            className: 'bg-red-500 text-white cursor-pointer',
                            onClick: deleteUser,
                        },
                    ]
                }
            />
            <Modal
                open={modalHook.isOpen}
                onClose={modalHook.closeModal}
                className={'flex flex-col items-center justify-center overflow-hidden gap-y-6 py-4 w-11/12 ipadMini:w-1/3 h-2/3 px-4 bg-darkD/60 backdrop-blur-lg rounded-xl border-2 border-lightest shadow-black shadow-lg'}
            >
                <ForgotPassword />
            </Modal>
        </div>
    );
}
