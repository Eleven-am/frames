import { FramesChannel } from '@/providers/realtimeNotifier';

class UserPondChannel extends FramesChannel {
    constructor () {
        super({
        });
    }
}

export const userPondChannel = new UserPondChannel();
