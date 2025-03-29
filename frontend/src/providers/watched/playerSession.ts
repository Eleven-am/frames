import { PlaybackSessionSchema } from '@/api/data-contracts';
import { ApiProvider } from '@/providers/apiProvider';
import { userStore } from '@/providers/userProvider';

interface PlayerLogicState {
    autoPlay: boolean;
    inform: boolean;
    isFrame: boolean;
    playbackId: string;
}

const defaultState: PlayerLogicState = {
    autoPlay: false,
    inform: false,
    isFrame: false,
    playbackId: '',
};

class PlayerSession extends ApiProvider<PlayerLogicState> {
    constructor () {
        super(defaultState);
    }

    setAutoPlay (autoPlay: boolean) {
        this.updateState({
            autoPlay,
        });

        return userStore.updateUser({
            autoplay: autoPlay,
        });
    }

    async setInform (inform: boolean, playbackId: string) {
        this.updateState({
            inform,
        });

        await userStore.updateUser({
            inform,
        });

        await this.apiAction((client) => client.playbackControllerUpdateInform(playbackId, {
            inform,
        }));
    }

    async setIncognito (incognito: boolean) {
        await userStore.updateUser({
            incognito,
        });
    }

    setState (state?: PlaybackSessionSchema) {
        if (!state) {
            return;
        }

        this.updateState({
            autoPlay: state.autoPlay,
            inform: state.inform,
            playbackId: state.playbackId,
        });
    }

    setIsFrame (isFrame: boolean) {
        this.updateState({
            isFrame,
        });
    }
}

export const playerSession = new PlayerSession();
export const usePlayerSessionState = playerSession.createStateHook();
export const usePlayerSessionActions = playerSession.createActionsHook();

