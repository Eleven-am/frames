import ss from './GroupWatch.module.css';
import React, {useEffect, useRef, useState} from "react";
import {Loading} from "./Loader";
import {useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {GroupWatchMediaIdAtom, GroupWatchMessages, GroupWatchSide, useGroupWatch} from "../../../utils/groupWatch";
import {
    useBasics,
    useClipboard,
    useDetectPageChange,
    useEventListener,
    useFetcher,
    useNavBar
} from "../../../utils/customHooks";
import {FrameMediaLite} from "../../../../server/classes/playBack";
import {Template} from "../buttons/Buttons";
import useUser from "../../../utils/userTools";
import {useBase} from "../../../utils/Providers";
import usePlayback from "../../../utils/playback";
import {useNotification} from "../../../utils/notificationConext";
import {useConfirmDispatch} from "./inform";
import {NotificationInterface} from "../../../../server/classes/notification";

export default function GroupWatchHandler() {
    useNavBar('groupWatch', 1);
    const setSide = useSetRecoilState(GroupWatchSide);
    const [med, setId] = useRecoilState(GroupWatchMediaIdAtom);
    const {playPause} = usePlayback();
    const {joinRoom, genRoom, connected, startSession, endSession, disconnect} = useGroupWatch();
    const firstUnmount = useRef(true);
    const {
        response,
        loading
    } = useFetcher<FrameMediaLite>(`/api/stream/getInfo?id=${med?.id}&save=${med?.auth === undefined}`, {
        revalidateOnFocus: false,
        onSuccess: data => {
            if (data && med) {
                setSide(true);
                med.auth === undefined ? genRoom(med.location || data.location) : joinRoom(med.auth);
            }
        }
    });

    useDetectPageChange(false, event => {
        if (!/room=/.test(event.url) && firstUnmount.current) {
            disconnect();

            setId(null);
            setSide(false);
            firstUnmount.current = false;
        }
    });

    useEffect(() => {
        return () => {
            setId(null);
            setSide(false);
        };
    }, []);

    if (loading && med)
        return <Loading/>;

    else if (response)
        return (
            <div className={ss.hldr}>
                <img src={response.backdrop} alt={response.name} className={ss.IMG}/>
                <div className={ss.foncer}/>
                <img className={ss.pstr} src={response.poster} alt={response.name}
                     style={{background: response.background}}/>
                <div className={ss.but}>
                    <Template id={0} onClick={() => startSession(playPause)} type={connected ? 'play' : 'none'}
                              name={connected ? 'start session' : 'connecting...'}/>
                    <Template id={1} type={'none'} name={'leave session'}
                              onClick={() => endSession(playPause, response)}/>
                </div>
            </div>
        )

    else return null;
}

export const GroupWatchSlide = () => {
    const visible = useRecoilValue(GroupWatchSide);
    const [section, setSection] = useState(1);
    const setSide = useSetRecoilState(GroupWatchSide);

    return (
        <div className={ss.sdbr} style={visible ? {right: 0} : {}}>

            <div className={ss.hdr}>
                <div>GroupWatch</div>
                <svg viewBox="0 0 24 24" onClick={() => setSide(false)}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
            </div>

            <ul className={ss.pckr}>
                <li className={section === 0 ? ss.actv : ''} onClick={() => setSection(0)}>online</li>
                <li className={section === 1 ? ss.actv : ''} onClick={() => setSection(1)}>connected</li>
                <li className={section === 2 ? ss.actv : ''} onClick={() => setSection(2)}>chat</li>
            </ul>
            <div className={ss.cnt}>
                {section === 0 && <GlobalOnline/>}
                {section === 1 && <GroupWatchOnline/>}
                {section === 2 && <GroupWatchActivity/>}
            </div>
        </div>
    )
}

const GlobalOnline = () => {
    const base = useBase();
    const {user} = useUser();
    const confirm = useConfirmDispatch();
    const {copy} = useClipboard();
    const {getBaseUrl} = useBasics();
    const {room} = useGroupWatch();
    const {globalChannel: {online, whisper}} = useNotification();
    const saveToClipboard = async () => {
        const url = getBaseUrl() + `/room=${room}`;
        await copy(url, 'Video Session url copied to clipboard');
    }

    const inviteUser = async (address: string, username: string) => {
        const url = getBaseUrl() + `/room=${room}`;
        confirm({
            type: 'client',
            heading: 'Invite user',
            message: `Do you want to invite ${username} to join your GroupWatch session?`,
            onOk: () => whisper<NotificationInterface>(address, {
                type: 'groupWatchInvite',
                title: 'Invite to GroupWatch',
                message: `${user?.username} has invited you to join their GroupWatch session.`,
                opened: true,
                sender: user!.username,
                data: {url}
            }),
            onCancel: () => {
            },
            confirmText: 'Invite',
            cancelText: 'Cancel',
            confirm: true
        })
    }

    if (online.filter(e => e.username !== user?.username).length < 1)
        return (
            <div className={ss.chtMsg}>
                <div className={`${ss.chtMsgItm} ${ss.hvr}`} onClick={saveToClipboard}>
                    <div className={ss.atr}>
                        <svg viewBox="0 0 24 24">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                            <polyline points="16 6 12 2 8 6"/>
                            <line x1="12" y1="2" x2="12" y2="15"/>
                        </svg>
                    </div>
                    <div className={ss.onrHdr}>
                        <div className={ss.onrHdrUsr}>No Users online</div>
                        <div className={ss.onrHdrStm}>
                            <div>click here to copy the sharable link</div>
                        </div>
                    </div>
                </div>
            </div>
        )

    return (
        <div className={ss.chtMsg}>
            {online.filter(e => e.username !== user?.username).map(user => (
                <div className={`${ss.chtMsgItm} ${ss.hvr}`} key={user.phx_ref}
                     onClick={() => inviteUser(user.reference, user.username)}>
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
                </div>
            ))}
        </div>
    )
}

const GroupWatchOnline = () => {
    const {user} = useUser();
    const base = useBase();
    const {copy} = useClipboard();
    const {getBaseUrl} = useBasics();
    const {channel: {online: users}, room} = useGroupWatch();

    const saveToClipboard = async () => {
        const url = getBaseUrl() + `/room=${room}`;
        await copy(url, 'Video Session url copied to clipboard');
    }

    if (users.filter(e => e.username !== user?.username).length < 1)
        return (
            <div className={ss.chtMsg}>
                <div className={`${ss.chtMsgItm} ${ss.hvr}`} onClick={saveToClipboard}>
                    <div className={ss.atr}>
                        <svg viewBox="0 0 24 24">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                            <polyline points="16 6 12 2 8 6"/>
                            <line x1="12" y1="2" x2="12" y2="15"/>
                        </svg>
                    </div>
                    <div className={ss.onrHdr}>
                        <div className={ss.onrHdrUsr}>No Users online</div>
                        <div className={ss.onrHdrStm}>
                            <div>click here to copy the sharable link</div>
                        </div>
                    </div>
                </div>
            </div>
        )

    return (
        <div className={ss.chtMsg}>
            {users.filter(e => e.username !== user?.username).map(user => (
                <div className={ss.chtMsgItm} key={user.phx_ref}>
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
                </div>
            ))}
        </div>
    )
}

const GroupWatchActivity = () => {
    const {user} = useUser();
    const base = useBase();
    const {sendMessage: send} = useGroupWatch();
    const messages = useRecoilValue(GroupWatchMessages);
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"})
    }

    const sendMessage = () => {
        if (message.length > 0) {
            send({data: message, action: 'says'});
            setMessage('');
            inputRef.current?.blur();
        }
    }

    useEventListener('keyup', event => {
        if (event.code === 'Enter')
            sendMessage();
    })

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <>
            <div className={ss.chtMsg}>
                {messages.map((msg, i) => (
                    <div key={i} className={ss.msg} style={msg.username === user?.username ? {textAlign: 'right'} : {}}>
                        <div className={ss.msgUsr}>{msg.username}</div>
                        <div className={ss.msgTxt}>{msg.message}</div>
                        <div className={ss.msgTime}>{base.compareDates(msg.received)}</div>
                    </div>
                ))}
                <div ref={messagesEndRef}/>
            </div>
            <div className={ss.chtCntr}>
                <input type="text" onChange={(e) => setMessage(e.target.value)} value={message}/>
                <button onClick={sendMessage}>
                    <svg viewBox="0 0 24 24">
                        <polyline points="16 12 12 8 8 12"/>
                        <line x1="12" y1="16" x2="12" y2="8"/>
                    </svg>
                </button>
            </div>
        </>
    )
}