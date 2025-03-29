import * as React from 'react';

import { AuthBaseEmail } from './auth-base';

interface ResetEmailProps {
    username: string;
    token: string;
    endpoint: string;
    inviteFromIp: string;
    deviceName: string;
}

export function ResetEmail (props: ResetEmailProps) {
    return (
        <AuthBaseEmail
            username={props.username}
            infoText="We received a request to reset your password. If this was you, simply click the button below to reset your password."
            buttonText="Reset Password"
            buttonHref={`${props.endpoint}/auth?reset=${props.token}`}
            inviteFromIp={props.inviteFromIp}
            deviceName={props.deviceName}
            endpoint={props.endpoint}
            previewText={'Reset your password'}
        />
    );
}
