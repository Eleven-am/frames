import * as React from 'react';

import { AuthBaseEmail } from './auth-base';

interface VerifyEmailProps {
    username: string;
    token: string;
    endpoint: string;
    inviteFromIp: string;
    deviceName: string;
}

export function VerifyEmail (props: VerifyEmailProps) {
    return (
        <AuthBaseEmail
            username={props.username}
            infoText="Please verify your email address by clicking the button below."
            buttonText="Verify Email"
            buttonHref={`${props.endpoint}/auth?verify=${props.token}`}
            inviteFromIp={props.inviteFromIp}
            deviceName={props.deviceName}
            endpoint={props.endpoint}
            previewText={'Verify your email'}
        />
    );
}
