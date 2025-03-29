import { OauthProvider } from '@/api/data-contracts';
import { FormProvider } from '@/components/processForm';
import { userStore } from '@/providers/userProvider';
import { sleep } from '@/utils/helpers';
import { openWindow } from '@/utils/popUp';
import { hasError } from '@eleven-am/fp';
import { redirect } from '@tanstack/react-router';

export enum SetupProcess {
    TmDBForm = 'tmdbForm',
    FanArtForm = 'fanArtForm',
    OpenAIForm = 'openAIForm',
    FileBrowserForm = 'fileBrowserForm',
    OpenSubtitlesForm = 'openSubtitlesForm',
    MailServerForm = 'mailServerForm',
    AdminAccountForm = 'adminAccountForm',
    Success = 'success',
}

export type OauthDetails = {
    name: string;
    client_id: string;
    client_secret: string;
};

interface SetupState {
    driveModal: boolean;
    dropboxModal: boolean;
    s3Modal: boolean;
    localModal: boolean;
}

interface SetupSequence {
    tmdbConfigured: SetupProcess;
    fanArtConfigured: SetupProcess;
    openaiConfigured: SetupProcess;
    adminConfigured: SetupProcess;
    mailServerConfigured: SetupProcess;
    openSubtitlesConfigured: SetupProcess;
}

const setupSequence = [
    SetupProcess.TmDBForm,
    SetupProcess.FanArtForm,
    SetupProcess.OpenAIForm,
    SetupProcess.FileBrowserForm,
    SetupProcess.OpenSubtitlesForm,
    SetupProcess.MailServerForm,
    SetupProcess.AdminAccountForm,
    SetupProcess.Success,
];

class SetupProvider extends FormProvider<SetupState, SetupProcess> {
    constructor () {
        super({
            loading: false,
            isPrevious: false,
            error: null,
            process: SetupProcess.TmDBForm,
            success: null,
            driveModal: false,
            dropboxModal: false,
            s3Modal: false,
            localModal: false,
            processHistory: [SetupProcess.TmDBForm],
            processSequence: setupSequence,
            endProcess: SetupProcess.Success,
            skippableProcesses: [
                SetupProcess.MailServerForm,
                SetupProcess.OpenSubtitlesForm,
            ],
        });
    }

    openDriveModal () {
        this.updateState({
            driveModal: true,
        });
    }

    closeDriveModal () {
        this.updateState({
            driveModal: false,
        });
    }

    openDropboxModal () {
        this.updateState({
            dropboxModal: true,
        });
    }

    closeDropboxModal () {
        this.updateState({
            dropboxModal: false,
        });
    }

    openS3Modal () {
        this.updateState({
            s3Modal: true,
        });
    }

    closeS3Modal () {
        this.updateState({
            s3Modal: false,
        });
    }

    openLocalModal () {
        this.updateState({
            localModal: true,
        });
    }

    closeLocalModal () {
        this.updateState({
            localModal: false,
        });
    }

    async authenticateOauth (params: OauthDetails, provider: OauthProvider) {
        const response = await this.apiAction((client) => client.setupControllerCreateOauthConfig({
            clientId: params.client_id,
            clientSecret: params.client_secret,
            name: params.name,
            provider,
        }));

        if (hasError(response)) {
            this.updateState({
                error: response.error.message,
            });

            return;
        }

        const data = await openWindow<{ storageId: string }>(response.data.message, `Authenticate with ${provider}`);

        if (hasError(data)) {
            this.updateState({
                error: data.error.message,
            });

            return;
        }

        return data.data.storageId;
    }

    async authenticateLocal (name: string) {
        const response = await this.apiAction((client) => client.setupControllerGetLocalStorage({
            name,
        }));

        if (hasError(response)) {
            this.updateState({
                error: response.error.message,
            });

            return;
        }

        return response.data.id;
    }

    async updateStorage (storageId: string, movieLocations: string[], showLocations: string[]) {
        const response = await this.apiAction((client) => client.setupControllerUpdateStorage({
            cloudStorageId: storageId,
            movieLocations,
            showLocations,
        }));

        if (hasError(response)) {
            this.updateState({
                error: response.error.message,
            });

            return;
        }

        this.updateState({
            skippableProcesses: [
                ...this.state.skippableProcesses,
                SetupProcess.FileBrowserForm,
            ],
        });

        return response.data;
    }

    async getConfiguration () {
        const response = await this.apiAction((client) => client.setupControllerGetConfiguration());

        if (hasError(response)) {
            if (response.error.message === 'The application has already been configured') {
                throw redirect({
                    to: '/',
                });
            }

            throw response.error;
        }

        const valueToSequence: SetupSequence = {
            tmdbConfigured: SetupProcess.TmDBForm,
            fanArtConfigured: SetupProcess.FanArtForm,
            openaiConfigured: SetupProcess.OpenAIForm,
            adminConfigured: SetupProcess.AdminAccountForm,
            mailServerConfigured: SetupProcess.MailServerForm,
            openSubtitlesConfigured: SetupProcess.OpenSubtitlesForm,
        };

        const keys = Object.keys(valueToSequence) as (keyof SetupSequence)[];

        const sequence = keys.reduce<SetupProcess[]>((acc, key) => {
            if (response.data[key]) {
                acc.push(valueToSequence[key]);
            }

            return acc;
        }, []);

        if (response.data.storagesConfigured > 0) {
            sequence.push(SetupProcess.FileBrowserForm);
        }

        const processSequence = setupSequence.filter((process) => !sequence.includes(process));

        const [first, ...rest] = processSequence;

        this.updateState({
            process: first,
            processSequence: rest,
            processHistory: [first],
        });
    }

    async createAdminConfig (email: string, username: string, password: string) {
        this.load();
        const response = await this.apiAction((client) => client.setupControllerCreateAdminConfig({
            email,
            username,
            password,
        }));

        if (hasError(response)) {
            this.updateState({
                error: response.error.message,
            });

            return;
        }

        await sleep(2000);
        this.processForward(SetupProcess.Success);
        await userStore.login(email, password);
    }
}

export const setupProvider = new SetupProvider();
export const useSetupActions = setupProvider.createActionsHook();
export const useSetupState = setupProvider.createStateHook();
