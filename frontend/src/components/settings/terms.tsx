export function Terms () {
    return (
        <div className={'w-full h-full flex items-center justify-center p-8'}>
            <div
                className={'flex flex-col h-full w-full text-lightest gap-y-4 overflow-y-scroll overflow-hidden scrollbar-hide'}
            >
                <h1 className={'text-3xl font-bold'}>
                    Terms of Service
                </h1>
                <h2 className={'text-2xl font-bold'}>
                    1. Introduction
                </h2>
                <p>
                    Welcome to Frames (&quot;the Application&quot; or &quot;the Service&quot;). By using our Application,
                    you agree to comply with and be bound by the following Terms of Service (&quot;Terms&quot;). Please
                    read these Terms carefully before using the Application.
                </p>
                <h2 className={'text-2xl font-bold'}>
                    2. Description of Service
                </h2>
                <p>
                    Frames is a self-hosted Streaming Video on Demand (SVOD) web application designed for personal use.
                    It is a React application with a NestJS backend, containerized using Docker. The Application allows
                    users to manage and stream their personal media content, share content with others, and integrate
                    with various third-party services.
                </p>
                <h2 className={'text-2xl font-bold'}>
                    3. Technical Requirements
                </h2>
                <p>3.1. To use Frames, you must have:</p>
                <ul className={'list-disc pl-8 flex flex-col gap-y-2'}>
                    <li>A server or system capable of running Docker containers</li>
                    <li>Existing PostgreSQL and Redis databases</li>
                    <li>Sufficient storage for your media files</li>
                    <li>A private network environment for hosting (recommended)</li>
                </ul>
                <p>
                    3.2. You are responsible for maintaining the necessary technical environment to run the Application
                    securely and efficiently.
                </p>
                <h2 className={'text-2xl font-bold'}>
                    4. User Accounts and Authentication
                </h2>
                <p>
                    4.1. To use the full features of the Application, you must create a user account. This account is
                    stored locally on your self-hosted instance of the Application.
                </p>
                <p>
                    4.2. The Application provides a feature requiring new users to have an authentication key to sign up.
                    As the server owner, you are responsible for managing and distributing these keys to control access
                    to your server.
                </p>
                <p>
                    4.3. You are responsible for maintaining the confidentiality of your account information and for all
                    activities that occur under your account.
                </p>
                <p>
                    4.4. We do not collect, store, or have access to your account information or any data associated with
                    your account.
                </p>
                <h2 className={'text-2xl font-bold'}>
                    5. Content Sharing and Access
                </h2>
                <p>
                    5.1. The Application allows users to share links (frames) to playback sessions, media, collections,
                    playlists, and other content.
                </p>
                <p>
                    5.2. Recipients of shared frames can access the video player without authentication. Access to any
                    other features or content requires authentication.
                </p>
                <p>
                    5.3. You are solely responsible for managing access to your content and understanding the
                    implications of sharing content through the Application.
                </p>
                <h2 className={'text-2xl font-bold'}>6. Third-Party Integrations and APIs</h2>
                <p>
                    6.1. The Application provides access to its API through a Swagger interface. You may use this to
                    create additional integrations at your own risk.
                </p>
                <p>6.2. The Application interacts with third-party services including TMDB API, Fanart, Open Subtitles,
                    and Apple servers for various functionalities.
                </p>
                <p>
                    6.3. We would like to extend our gratitude to TMDB for providing essential data for the
                    Application&#39;s functionality.
                </p>
                <p>
                    6.4. Your use of these third-party services through our Application is subject to their respective
                    terms of service and privacy policies.
                </p>
                <h2 className={'text-2xl font-bold'}>7. Updates and Maintenance</h2>
                <p>
                    7.1. We regularly release new Docker images for the Application. It is your responsibility to update
                    your instance to the latest version.
                </p>
                <p>7.2. We do not provide direct support or maintenance services. You are responsible for maintaining
                    and troubleshooting your instance of the Application.
                </p>
                <h2 className={'text-2xl font-bold'}>
                    8. Intellectual Property
                </h2>
                <p>8.1. The Application, including its original content, features, and functionality, is owned by Frames
                    and is protected by international copyright laws. All rights reserved.
                </p>
                <p>
                    8.2. You may not use the Application for any commercial purposes. It is strictly for personal use
                    only.
                </p>
                <p>
                    8.3. You may not copy, modify, create derivative works of, publicly display, publicly perform,
                    republish, download, store, or transmit any of the material on our Application, except as incidental
                    to normal web browsing or as required for the functioning of the Application on your self-hosted
                    instance.
                </p>
                <p>
                    8.4. Any feedback, comments, or suggestions you may provide regarding the Application is entirely
                    voluntary, and we will be free to use such feedback, comments or suggestions without any obligation
                    to you.
                </p>
                <h2 className={'text-2xl font-bold'}>
                    9. User Responsibilities and Prohibited Uses
                </h2>
                <p>
                    9.1. As a self-hosted application, you are solely responsible for the installation, maintenance, and
                    security of your instance of the Application.
                </p>
                <p>
                    9.2. You are responsible for all content stored and streamed through your instance of the
                    Application, including ensuring that you have the necessary rights to store and stream such
                    content.
                </p>
                <p>
                    9.3. While we strongly discourage piracy, we have no ability to monitor or control the content on
                    your self-hosted instance. You are solely responsible for ensuring that your use of the Application
                    complies with all applicable laws and regulations.
                </p>
                <p>
                    9.4. You agree not to use the Application:
                    <ul className={'list-disc pl-8 flex flex-col gap-y-2'}>
                        <li>
                            a. In any way that violates any applicable federal, state, local, or international law or
                            regulation.
                        </li>
                        <li>
                            b. To transmit, or procure the sending of, any advertising or promotional material, including
                            any &quot;junk mail,&quot; &quot;chain letter,&quot; &quot;spam,&quot; or any other similar
                            solicitation.
                        </li>
                        <li>
                            c. To impersonate or attempt to impersonate the Company, a Company employee, another user, or any
                            other person or entity.
                        </li>
                        <li>
                            d. To engage in any other conduct that restricts or inhibits anyone&#39;s use or enjoyment of the
                            Application, or which, as determined by us, may harm the Company or users of the Application or
                            expose them to liability.
                        </li>
                    </ul>
                </p>
                <h2 className={'text-2xl font-bold'}>
                    10. Privacy and Data Handling
                </h2>
                <p>
                    10.1. As a self-hosted application, we do not collect, store, or process any of your personal data or
                    usage information.
                </p>
                <p>
                    10.2. You are solely responsible for the security and privacy of the data stored in your instance of
                    the Application.
                </p>
                <p>
                    10.3. The Application does not implement any specific data protection measures (such as those
                    required by GDPR or CCPA). If you are subject to such regulations, it is your responsibility to
                    ensure your use of the Application complies with these laws.
                </p>
                <h2 className={'text-2xl font-bold'}>
                    11. Disclaimer of Warranties
                </h2>
                <p>
                    11.1. The Application is provided on an &quot;as is&quot; and &quot;as available&quot; basis, without
                    any warranties of any kind, either express or implied.
                </p>
                <p>
                    11.2. We do not warrant that the Application will be uninterrupted, timely, secure, or
                    error-free.
                </p>
                <p>
                    11.3. We make no warranties regarding the accuracy, reliability, or completeness of any third-party
                    data or services integrated into the Application.
                </p>
                <h2 className={'text-2xl font-bold'}>
                    12. Limitation of Liability
                </h2>
                <p>
                    12.1. In no event will the Company, its affiliates, or their licensors, service providers, employees,
                    agents, officers, or directors be liable for damages of any kind, under any legal theory, arising
                    out of or in connection with your use, or inability to use, the Application, including any direct,
                    indirect, special, incidental, consequential, or punitive damages.
                </p>
                <p>
                    12.2. You agree to not bring forth any disputes or legal actions against us relating to your use of
                    the Application.
                </p>
                <h2 className={'text-2xl font-bold'}>
                    13. Termination
                </h2>
                <p>
                    13.1. You may terminate your use of the Application at any time by uninstalling it from your server
                    and deleting all associated data.
                </p>
                <p>
                    13.2. We reserve the right to terminate or suspend access to our Application immediately, without
                    prior notice or liability, for any reason whatsoever, including without limitation if you breach the
                    Terms.
                </p>
                <h2 className={'text-2xl font-bold'}>
                    14. Changes to the Application
                </h2>
                <p>
                    We reserve the right to withdraw or amend the Application, and any service or material we provide via
                    the Application, in our sole discretion without notice. We will not be liable if for any reason all
                    or any part of the Application is unavailable at any time or for any period.
                </p>
                <h2 className={'text-2xl font-bold'}>
                    15. Future Monetization
                </h2>
                <p>
                    15.1. We reserve the right to introduce advertising or other forms of monetization to the Application
                    in the future.
                </p>
                <p>
                    15.2. If implemented, advertisements will be shown to all users of the Application. Users will not
                    have the ability to opt-out of viewing advertisements.
                </p>
                <p>
                    15.3. If such changes are implemented, we will provide notice and update these Terms accordingly.
                </p>
                <h2 className={'text-2xl font-bold'}>
                    16. Governing Law and Jurisdiction
                </h2>
                <p>
                    These Terms shall be governed by and construed in accordance with the laws of France, without regard
                    to its conflict of law provisions.
                </p>
                <h2 className={'text-2xl font-bold'}>
                    17. Changes to Terms of Service
                </h2>
                <p>
                    We may revise and update these Terms from time to time in our sole discretion. All changes are
                    effective immediately when we post them. Your continued use of the Application following the posting
                    of revised Terms means that you accept and agree to the changes.
                </p>
                <h2 className={'text-2xl font-bold'}>
                    18. Contact Information
                </h2>
                <p>
                    If you have any questions about these Terms or the Application, please contact us at
                    contact@frames.maix.ovh.
                </p>
                <p>
                    By using the Application, you acknowledge that you have read and understood these Terms and agree to
                    be bound by them.
                </p>
                <p>
                    Last updated: September 1, 2024
                </p>
            </div>
        </div>
    );
}
