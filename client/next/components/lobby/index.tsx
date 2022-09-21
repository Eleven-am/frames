import {SideBar, SideBarAtomFamily} from "../misc/sidebar";
import {useRecoilValue, useSetRecoilState} from "recoil";
import ss from "./GroupWatch.module.css";
import React, {memo, useCallback, useEffect, useMemo, useState} from "react";
import {HoverContainer} from "../buttons/Buttons";
import {PresenceInterface} from "../../../utils/realtime";
import info from "../info/Info.module.css";
import {useRouter} from "next/router";
import useBase from "../../../utils/provider";
import useNotifications, {MetaData, useUsers} from "../../../utils/notifications";
import Background from "../misc/back";
import {UserPlaybackSettingsContext} from "../../../utils/modify";
import {ErrorPage} from "../production/person";

function IncognitoPage({response}: {response: string[]}) {
    const userState = useRecoilValue(UserPlaybackSettingsContext);

    if (userState?.incognito) {
        return (
            <>
                <Background response={response} />
                <ErrorPage error={{
                    name: 'GroupWatch Incognito',
                    message: "You are in incognito mode, you can't see other active users."
                }}/>
            </>
        )
    }

    return <Lobby response={response} />
}

const Lobby = memo(({response}: {response: string[]}) => {
    const router = useRouter();
    const users = useUsers();
    const [hovered, setHovered] = useState('');
    const {requestToJoinSession} = useNotifications();
    const changeState = useSetRecoilState(SideBarAtomFamily('groupWatchLobby'));

    const onHovering = useCallback((b: boolean, user?: PresenceInterface) => {
        if (b && user)
            setHovered(user.identifier);
        else
            setHovered('');
    }, [])

    const metadata = useMemo(() => {
        if (hovered !== '') {
            const user = users.find(u => u.identifier === hovered);
            if (user && user.metadata.payload)
                return user.metadata.payload as MetaData;
        }
        return null;
    }, [hovered, users]);

    const close = useCallback(async () => {
        await router.back();
        changeState(false);
    }, [router, changeState])

    useEffect(() => changeState(true), [])

    return (
        <div className={ss.hldr}>
            <DisplayMetadata metadata={metadata} images={response} />
            <LobbySideBar close={close} users={users} onHover={onHovering} requestToJoinSession={requestToJoinSession}/>
        </div>
    )
})

const DisplayMetadata = memo(({images, metadata: response}: { metadata: MetaData | null, images: string[]}) => {
    if (!response) return <Background response={images} auth={true}/>

    return (
        <>
            <img src={response.backdrop} alt={response.name} className={ss.IMG}/>
            <div className={info['info-holders']}>
                <div className={info.infoNaming}>
                    {response.logo ? <img src={response.logo} alt={response.name}/> :
                        <span>{response.name}</span>}
                </div>
                <div className={info.infoOverview}>
                    <p>{response.overview}</p>
                </div>
            </div>
        </>
    )
})

interface LobbySideBarProps {
    users: PresenceInterface[];
    close: () => Promise<void>;
    onHover: (b: boolean, user?: (PresenceInterface | undefined)) => void;
    requestToJoinSession: (otherUser?: (PresenceInterface | undefined)) => Promise<void>
}

const LobbySideBar = memo(({close, onHover, requestToJoinSession, users}: LobbySideBarProps) => {
    const base = useBase();

    return (
        <SideBar atomName={'groupWatchLobby'} topic={"frames' lobby"} close={close}>
            <ul className={ss.pckr}>
                <li>online users</li>
            </ul>
            <div className={ss.cnt}>
                <div className={ss.chtMsg}>
                    {users.map(user => (
                        <HoverContainer
                            state={user} onClick={requestToJoinSession}
                            className={`${ss.chtMsgItm} ${ss.hvr}`} key={user.phx_ref} onHover={onHover}>
                            <div
                                className={`${ss.atr} ${user.presenceState === 'away' ? ss.away : user.presenceState.includes('watching') ? ss.streaming : ss.online}`}>
                                <svg viewBox="0 0 24 24">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </div>
                            <div className={ss.onrHdr}>
                                <div className={ss.onrHdrUsr}>{user.username}</div>
                                <div className={ss.onrHdrStm}>
                                    <div>{user.presenceState}</div>
                                    <div>{base.compareDates(new Date(+user.online_at * 1000))}</div>
                                </div>
                            </div>
                        </HoverContainer>
                    ))}
                </div>
            </div>
        </SideBar>
    )
})

export default memo(IncognitoPage);
