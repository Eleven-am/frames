export function Privacy () {
    return (
        <div className={'w-full h-full flex items-center justify-center p-8'}>
            <div className={'flex flex-col h-full w-full text-lightest gap-y-4 overflow-y-scroll overflow-hidden scrollbar-hide'}>
                <h1 className={'text-3xl font-bold'}>
                    Privacy Policy
                </h1>
                <p>Last Updated: September 1, 2024</p>

                <h2 className={'text-2xl font-bold'}>
                    1. Introduction
                </h2>
                <p>
                    Welcome to Frames (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). This Privacy Policy is designed to inform you about our practices regarding the collection, use, and disclosure of information that you may provide via our self-hosted Streaming Video on Demand (SVOD) application (&quot;the Application&quot; or &quot;Frames&quot;).
                </p>

                <h2 className={'text-2xl font-bold'}>
                    2. Key Points
                </h2>
                <ul className={'list-disc pl-8 flex flex-col gap-y-2'}>
                    <li>Frames is a self-hosted application, which means that we do not collect, store, or have access to your personal data or usage information.</li>
                    <li>You are responsible for the security and privacy of the data stored in your instance of the Application.</li>
                    <li>The Application interacts with third-party services, which may have their own privacy policies.</li>
                </ul>

                <h2 className={'text-2xl font-bold'}>
                    3. Information Collection and Use
                </h2>
                <p>
                    3.1. Personal Information: As Frames is a self-hosted application, we do not collect, store, or have access to any personal information you input into your instance of the Application. All user accounts, content, and usage data are stored locally on your self-hosted instance.
                </p>
                <p>
                    3.2. Non-Personal Information: We do not collect any non-personal information or usage statistics from your instance of the Application.
                </p>

                <h2 className={'text-2xl font-bold'}>
                    4. Data Storage and Security
                </h2>
                <p>
                    4.1. Data Storage: All data, including user accounts, media content, playlists, and usage information, is stored locally on your self-hosted instance of Frames. We have no access to this data.
                </p>
                <p>
                    4.2. Security: As the host of your own instance of Frames, you are solely responsible for implementing and maintaining security measures to protect your data. We strongly recommend hosting the Application on a private network and implementing appropriate access controls.
                </p>

                <h2 className={'text-2xl font-bold'}>
                    5. Third-Party Services
                </h2>
                <p>
                    5.1. The Application interacts with third-party services including TMDB API, Fanart, Open Subtitles, and Apple servers for various functionalities. These interactions may involve the transmission of data to these services.
                </p>
                <p>
                    5.2. We do not control and are not responsible for the privacy practices of these third-party services. We encourage you to review the privacy policies of these services.
                </p>

                <h2 className={'text-2xl font-bold'}>
                    6. Sharing of Information
                </h2>
                <p>
                    We do not share any information, as we do not collect or have access to any data from your self-hosted instance of Frames.
                </p>

                <h2 className={'text-2xl font-bold'}>
                    7. User Rights
                </h2>
                <p>
                    As all data is stored locally on your self-hosted instance, you have full control over your data. You can access, modify, export, or delete your data at any time by managing your local instance of the Application.
                </p>

                <h2 className={'text-2xl font-bold'}>
                    8. Children's Privacy
                </h2>
                <p>
                    Frames does not have any age restrictions. As the host of your instance, you are responsible for ensuring compliance with any applicable laws regarding children's privacy.
                </p>

                <h2 className={'text-2xl font-bold'}>
                    9. Changes to This Privacy Policy
                </h2>
                <p>
                    We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date at the top of this Privacy Policy.
                </p>

                <h2 className={'text-2xl font-bold'}>
                    10. Contact Us
                </h2>
                <p>
                    If you have any questions about this Privacy Policy, please contact us at contact@frames.maix.ovh.
                </p>

                <h2 className={'text-2xl font-bold'}>
                    11. Consent
                </h2>
                <p>
                    By using Frames, you hereby consent to this Privacy Policy and agree to its terms.
                </p>
            </div>
        </div>
    );
}
