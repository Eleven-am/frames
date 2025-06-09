import { Endpoint, OnConnectionRequest } from '@eleven-am/pondsocket-nest';

import { Assigns } from './socket.schema';
import { CurrentSession, CurrentToken } from '../authorisation/auth.decorators';
import { CachedSession } from '../session/session.contracts';


@Endpoint('/api/realtime')
export class SocketEndpoint {
    @OnConnectionRequest()
    onConnectionRequest (@CurrentSession.WS() session: CachedSession, @CurrentToken.WS() token: string) {
        const assigns: Assigns = {
            token,
            browserId: session.browserId,
        };

        return {
            assigns,
        };
    }
}
