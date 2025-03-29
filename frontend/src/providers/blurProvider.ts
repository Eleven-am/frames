import { Notifier } from '@eleven-am/notifier';

class BlurProvider extends Notifier<{ blur: string }> {
    constructor () {
        super({
            blur: '154,164,165,',
        });
    }

    setBlur (blur?: string) {
        this.updateState({
            blur: blur ?? '154,164,165,',
        });
    }
}

const blurProvider = new BlurProvider();

export const useBlurState = blurProvider.createStateHook();
export const useBlurActions = blurProvider.createActionsHook();
