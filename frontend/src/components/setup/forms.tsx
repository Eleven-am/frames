import driveLogo from '@/assets/drive.webp';
import dropboxLogo from '@/assets/dropbox.png';
import localModal from '@/assets/local.png';
import s3Logo from '@/assets/s3.png';
import { SubmitButton } from '@/components/auth/buttons';
import { EmailInput, UsernameInput, PasswordInput } from '@/components/auth/inputs';
import { AvatarIcon } from '@/components/avatar';
import { BaseButton } from '@/components/button';
import { LazyImage } from '@/components/lazyImage';
import { ProcessForm, ProcessItemProps } from '@/components/processForm';
import { InputGroup } from '@/components/setup/input';
import { useAuthStore } from '@/providers/authStore';
import { SetupProcess, useSetupState, useSetupActions } from '@/providers/setupProvider';
import { MailServer, OpenSubtitles, setupMutations } from '@/queries/setup';
import { createStyles } from '@/utils/colour';
import { tw } from '@/utils/style';

import { useMutation } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

const baseClass = 'text-white disabled:cursor-not-allowed disabled:pointer-events-none w-full focus:ring-0 focus:outline-none font-medium rounded-lg text-sm macbook:text-xl px-5 py-2.5 text-center inline-flex items-center justify-center my-2 shadow-black/70 shadow-sm hover:shadow-md hover:shadow-black/80 transition-all duration-200 ease-in-out';

function TmdbApiKeyForm () {
    const { mutate } = useMutation(setupMutations.saveTmdbConfig);
    const handleSubmit = useCallback((value: { tmdbApiKey: string }) => mutate(value.tmdbApiKey), [mutate]);

    return (
        <InputGroup<{ tmdbApiKey: string }>
            label={'Tmdb API Key'}
            handleSubmit={handleSubmit}
            description={'Frames requires a Tmdb API key to fetch movie and TV show data. A key can be obtained from the Tmdb website.'}
            inputs={
                [
                    {
                        name: 'tmdbApiKey',
                        placeholder: 'Enter Tmdb API Key',
                    },
                ]
            }
        />
    );
}

function FanArtTvApiKeyForm () {
    const { mutate } = useMutation(setupMutations.saveFanArtTvConfig);
    const handleSubmit = useCallback((value: { fanArtTvApiKey: string }) => mutate(value.fanArtTvApiKey), [mutate]);

    return (
        <InputGroup<{ fanArtTvApiKey: string }>
            label={'FanArtTv API Key'}
            handleSubmit={handleSubmit}
            description={'Frames requires a FanArtTv API key to fetch movie and TV show artwork. A key can be obtained from the FanArtTv website.'}
            inputs={
                [
                    {
                        name: 'fanArtTvApiKey',
                        placeholder: 'Enter FanArtTv API Key',
                    },
                ]
            }
        />
    );
}

function OpenAIApiKeyForm () {
    const { mutate } = useMutation(setupMutations.saveOpenAiConfig);
    const handleSubmit = useCallback((value: { openAIApiKey: string }) => mutate(value.openAIApiKey), [mutate]);

    return (
        <InputGroup<{ openAIApiKey: string }>
            label={'OpenAI API Key'}
            handleSubmit={handleSubmit}
            description={'Frames requires an OpenAI API key to suggest new media for viewing based on previous activity. A key can be obtained from the OpenAI website.'}
            inputs={
                [
                    {
                        name: 'openAIApiKey',
                        placeholder: 'Enter OpenAI API Key',
                    },
                ]
            }
        />
    );
}

function OpenSubtitlesForm () {
    const { mutate } = useMutation(setupMutations.saveOpenSubtitlesConfig);
    const handleSubmit = useCallback((value: OpenSubtitles) => mutate(value), [mutate]);

    return (
        <InputGroup<OpenSubtitles>
            handleSubmit={handleSubmit}
            label={'OpenSubtitles Configuration'}
            description={'Frames requires an OpenSubtitles API key to fetch subtitles. Consider creating an account on the OpenSubtitles website. This configuration is optional.'}
            inputs={
                [
                    {
                        name: 'username',
                        placeholder: 'OpenSubtitles Username',
                    },
                    {
                        name: 'password',
                        isPassword: true,
                        placeholder: 'OpenSubtitles Password',
                    },
                    {
                        name: 'userAgent',
                        placeholder: 'OpenSubtitles User Agent',
                    },
                ]
            }
        />
    );
}

function MailConfigForm () {
    const { mutate } = useMutation(setupMutations.saveMailConfig);
    const handleSubmit = useCallback((value: MailServer) => mutate(value), [mutate]);

    return (
        <InputGroup<MailServer>
            handleSubmit={handleSubmit}
            label={'Mail Server Configuration'}
            description={'Frames requires a mail server to send emails. The mail server configuration can be set here. This configuration is optional.'}
            inputs={
                [
                    {
                        name: 'host',
                        placeholder: 'Mail Server Host',
                    },
                    {
                        name: 'port',
                        placeholder: 'Mail Server Port',
                        validate: (port) => parseInt(port, 10) > 0,
                    },
                    {
                        name: 'user',
                        placeholder: 'Mail Server User',
                    },
                    {
                        name: 'pass',
                        isPassword: true,
                        placeholder: 'Mail Server Password',
                    },
                    {
                        name: 'domain',
                        placeholder: 'Mail Server Domain',
                    }
                ]
            }
        />
    );
}

function CreateAccount () {
    const { createAdminConfig } = useSetupActions();
    const accountState = useAuthStore();

    const handleCreateAccount = useCallback(async () => {
        if (accountState.email.error || accountState.password.error) {
            return;
        }

        await createAdminConfig(accountState.email.email, accountState.username.username, accountState.password.password);
    }, [
        accountState.email.error,
        accountState.email.email,
        accountState.password.error,
        accountState.password.password,
        accountState.username.username,
        createAdminConfig,
    ]);

    return (
        <ProcessForm.Item
            handleSubmit={handleCreateAccount}
        >
            <EmailInput
                name={'email'}
                placeholder={'enter your email'}
            />
            <UsernameInput
                ignoreCheck
                name={'username'}
                placeholder={'enter your username'}
            />
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
                    label={'create account'}
                    tooltip={'create account'}
                />
            </div>
        </ProcessForm.Item>
    );
}

function Success () {
    return (
        <ProcessForm.Item />
    );
}

function FileBrowserForm () {
    const { openDriveModal, openDropboxModal, openS3Modal, openLocalModal } = useSetupActions();

    const files = useMemo(() => [
        {
            logo: driveLogo,
            color: '149, 173, 121',
            onClick: openDriveModal,
            buttonLabel: 'connect to google drive',
        },
        {
            logo: dropboxLogo,
            color: '61, 114, 227',
            onClick: openDropboxModal,
            buttonLabel: 'connect to dropbox',
        },
        {
            logo: s3Logo,
            color: '222, 141, 71',
            onClick: openS3Modal,
            buttonLabel: 'connect to box',
        },
        {
            logo: localModal,
            color: '181, 53, 84',
            onClick: openLocalModal,
            buttonLabel: 'connect to local',
        },
    ], [openDriveModal, openDropboxModal, openLocalModal, openS3Modal]);

    return (
        <ProcessForm.Item
            className={'flex flex-col items-center justify-center'}
        >
            {
                files.map((file) => (
                    <BaseButton
                        type={'button'}
                        onClick={file.onClick}
                        key={file.buttonLabel}
                        title={file.buttonLabel}
                        style={createStyles(file.color, [3, 4], true)}
                        className={tw(baseClass, 'bg-dark-400 hover:bg-dark-300 disabled:text-lightL disabled:bg-dark-400')}
                    >
                        <LazyImage src={file.logo} alt={file.buttonLabel} className={'h-6 max-w-6 object-contain mr-2'} />
                        <span>{file.buttonLabel.toLowerCase()}</span>
                    </BaseButton>
                ))
            }
        </ProcessForm.Item>
    );
}

export function AccountIcon () {
    const process = useSetupState((state) => state.process);

    if (![SetupProcess.Success, SetupProcess.AdminAccountForm].includes(process)) {
        return null;
    }

    return (
        <div className={'flex flex-col items-center justify-center'}>
            <div
                className={`absolute w-20 h-20 border-2 border-lightest rounded-full p-2 backdrop-blur-xl fullHD:scale-125 transition-all duration-500 ease-in-out ${process !== SetupProcess.Success ? '-top-8' : 'top-32'}`}
            >
                <AvatarIcon
                    circleClassName={'fill-darkD'}
                    circleOpacity={0.2}
                    sessionClassName={'fill-lightest'}
                />
            </div>
        </div>
    );
}

export const setupItems: ProcessItemProps<SetupProcess>[] = [
    {
        process: SetupProcess.TmDBForm,
        item: <TmdbApiKeyForm />,
    },
    {
        process: SetupProcess.FanArtForm,
        item: <FanArtTvApiKeyForm />,
    },
    {
        process: SetupProcess.OpenAIForm,
        item: <OpenAIApiKeyForm />,
    },
    {
        process: SetupProcess.OpenSubtitlesForm,
        item: <OpenSubtitlesForm />,
    },
    {
        process: SetupProcess.MailServerForm,
        item: <MailConfigForm />,
    },
    {
        process: SetupProcess.AdminAccountForm,
        item: <CreateAccount />,
    },
    {
        process: SetupProcess.Success,
        item: <Success />,
    },
    {
        process: SetupProcess.FileBrowserForm,
        item: <FileBrowserForm />,
    },
];
