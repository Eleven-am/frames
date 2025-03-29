import { Html, Head, Preview, Body, Container, Section, Img, Text, Button, Link } from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import * as React from 'react';

interface AuthBaseEmailProps {
    username: string;
    buttonHref: string;
    buttonText: string;
    infoText: string;
    deviceName: string;
    inviteFromIp: string;
    previewText: string;
    endpoint: string;
}

export function AuthBaseEmail ({ username, previewText, buttonText, buttonHref, infoText, deviceName, inviteFromIp, endpoint }: AuthBaseEmailProps) {
    return (
        <Html>
            <Head/>
            <Preview>
                {previewText}
            </Preview>
            <Tailwind
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                config={{
                    theme: {
                        extend: {
                            colors: {
                                darkD: '#01101C',
                                darkM: '#052E51',
                                darkL: '#225D90',
                                lightD: '#4B7BAB',
                                lightM: '#7BA4CC',
                                lightL: '#A5BCD9',
                                lightest: '#D9EEFF',
                            },
                            textShadow: {
                                none: 'none',
                                sm: '0 1px 2px var(--tw-shadow-color)',
                                DEFAULT: '0 2px 4px var(--tw-shadow-color)',
                                lg: '0 8px 16px var(--tw-shadow-color)',
                            },
                        },
                    },
                }}
            >
                <Body className="bg-white my-auto mx-auto font-sans px-2">
                    <Container className={'relative flex flex-col border border-solid border-darkM shadow-md shadow-black rounded my-[40px] px-[5px] py-2 mx-auto w-[465px]'}>
                        <Section className={'w-[453px] h-[650px] py-5'}>
                            <Section className={'w-[453px] flex items-center justify-center'}>
                                <Img
                                    src={`${endpoint}/favicons/android-chrome-512x512.png`}
                                    className={'w-14 h-14 my-4'}
                                    alt="Logo"
                                />
                            </Section>
                            <Text className={'text-darkM m-4 text-left text-xl'}>
                                Hi {username},
                            </Text>
                            <Text className={'text-darkM m-4 text-left text-lg'}>
                                {infoText}
                            </Text>
                            <Button
                                className={'bg-darkD text-lightL m-4 px-4 py-3 mt-4 rounded-lg text-xl font-bold shadow-md shadow-black'}
                                href={buttonHref}
                            >
                                {buttonText}
                            </Button>
                            <Text className={'text-darkM m-4 text-left text-lg'}>
                                If you did not make this request, you can safely ignore this email.
                            </Text>
                            <Text className={'text-darkM mx-4 my-1 text-left text-md'}>
                                If you have any questions, please contact us at{' '}
                                <Link href="mailto:help@frames.com">
                                    Help Center.{' '}
                                </Link>
                                This request was made from the IP address {inviteFromIp} using a device, {deviceName}.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}
