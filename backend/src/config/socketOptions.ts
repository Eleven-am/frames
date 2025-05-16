import { AuthorizationSocketGuard } from '@eleven-am/authorizer';
import { Metadata } from '@eleven-am/pondsocket-nest';

export const socketOptions: Metadata = {
    isGlobal: true,
    guards: [AuthorizationSocketGuard],
};
