import { Endpoint, OnConnectionRequest } from '@eleven-am/pondsocket-nest';
import { CurrentSession, CurrentToken } from '../authorisation/auth.decorators';
import { CachedSession } from '../session/session.contracts';

import { Assigns } from './socket.schema';


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
