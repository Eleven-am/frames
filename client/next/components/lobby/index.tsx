import {SideBar, SideBarAtomFamily} from "../misc/sidebar";
import {atom, useRecoilValue, useSetRecoilState} from "recoil";
import ss from "./GroupWatch.module.css";
import React, {useCallback, useEffect} from "react";
import {HoverContainer} from "../buttons/Buttons";
import {PresenceInterface} from "../../../utils/realtime";
import info from "../info/Info.module.css";
import {useRouter} from "next/router";
import useUser from "../../../utils/user";
import useBase from "../../../utils/provider";
import useNotifications from "../../../utils/notifications";
import Background from "../misc/back";
import {UserPlaybackSettingsContext} from "../../../utils/modify";
import {ErrorPage} from "../production/person";

const metadataAtom = atom<{ logo: string | null, backdrop: string, name: string, poster: string, overview: string } | null>({
    key: 'metadataAtom',
    default: null,
})

export default function IncognitoPage ({response}: { response: string[] }) {
    const userState = useRecoilValue(UserPlaybackSettingsContext);

    if (userState?.incognito) {
        return (
            <>
                <Background response={response}/>
                <ErrorPage error={{
                    name: 'GroupWatch Incognito',
                    message: "You are in incognito mode, you can't see other active users."
                }}/>
            </>
        )
    }

    return <Lobby response={response}/>
}

function Lobby({response}: { response: string[] }) {
    const changeState = useSetRecoilState(SideBarAtomFamily('groupWatchLobby'));

    useEffect(() => changeState(true), [])

    return (
        <div className={ss.hldr}>
            <DisplayMetadata response={response}/>
            <LobbySideBar/>
        </div>
    )
}

const DisplayMetadata = ({response: images}: { response: string[] }) => {
    const response = useRecoilValue(metadataAtom);

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
}

const LobbySideBar = () => {
    const base = useBase();
    const {user} = useUser();
    const setMetadata = useSetRecoilState(metadataAtom);
    const {users, requestToJoinSession} = useNotifications();
    const [hovered, setHovered] = React.useState('');
    const [hovering, setHovering] = React.useState(false);
    const setState = useSetRecoilState(SideBarAtomFamily('groupWatchLobby'));
    const router = useRouter();

    const close = useCallback(async () => {
        await router.push('/');
        setState(false);
    }, [router, setState])

    useEffect(() => {
        return () => {
            setState(false);
        }
    }, [])

    const onHovering = useCallback((b: boolean, user?: PresenceInterface) => {
        if (b && user)
            setHovered(user.identifier);

        setHovering(b);
    }, [])

    const onMouseMove = useCallback(() => {
        if (!hovering)
            setHovered('');
    }, [hovering])

    useEffect(() => {
        if (hovered !== '') {
            const user = users.find(u => u.identifier === hovered);
            if (user && user.metadata.payload)
                setMetadata(user.metadata.payload);
            else
                setMetadata(null);
        } else
            setMetadata(null);
    }, [hovered, users]);

    return (
        <SideBar atomName={'groupWatchLobby'} topic={"frames' lobby"} close={close}>
            <ul className={ss.pckr}>
                <li>online users</li>
            </ul>
            <div className={ss.cnt} onMouseMove={onMouseMove}>
                <div className={ss.chtMsg}>
                    {users.filter(e => e.identifier !== user?.identifier).map(user => (
                        <HoverContainer state={user} onClick={requestToJoinSession}
                                        className={`${ss.chtMsgItm} ${ss.hvr}`} key={user.phx_ref} onHover={onHovering}>
                            <div
                                className={`${ss.atr} ${user.presenceState === 'away' ? ss.away : user.presenceState === 'streaming' ? ss.streaming : ss.online}`}>
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
}
