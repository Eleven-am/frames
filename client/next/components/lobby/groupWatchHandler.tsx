import ss from './GroupWatch.module.css';
import React, {memo, useCallback, useEffect, useRef, useState} from "react";
import {Loading} from "../misc/Loader";
import {useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {
    GroupWatchMediaIdAtom,
    GroupWatchMessages,
    GroupWatchMessagesInterface,
    GroupWatchSection,
    Message,
    useGroupWatch
} from "../../../utils/groupWatch";
import {
    subscribe,
    useBasics,
    useClipboard,
    useDetectPageChange,
    useEventListener,
    useFetch,
} from "../../../utils/customHooks";
import {FramesButton} from "../buttons/Buttons";
import {FrameMediaLite} from "../../../../server/classes/playback";
import {SideBar, SideBarAtomFamily} from "../misc/sidebar";
import useBase from "../../../utils/provider";
import {useNavBar} from "../navbar/navigation";
import {useCentreControls} from "../../../utils/playback";
import {PresenceInterface} from "../../../utils/realtime";
import useNotifications, {useUsers} from "../../../utils/notifications";
import {BaseClass} from "../../../../server/classes/base";

function GroupWatchHandler() {
    useNavBar('groupWatch', 1);
    const [med, setId] = useRecoilState(GroupWatchMediaIdAtom);
    const setSide = useSetRecoilState(SideBarAtomFamily('GroupWatchSlider'));
    const {playPause} = useCentreControls(false);
    const {joinRoom, genRoom, connected, startSession, endSession, disconnect} = useGroupWatch();
    const {
        response,
        loading
    } = useFetch<FrameMediaLite>('/api/stream/getInfo', {id: `${med?.id}`, save: `${med?.auth === undefined}`});

    subscribe(data => {
        if (data && med) {
            setSide(true);
            med.auth === undefined ? genRoom(med.location || data.location) : joinRoom(med.auth);
        }
    }, response)

    useDetectPageChange(false, event => {
        if (!/room=/.test(event.url)) {
            disconnect();

            setId(null);
            setSide(false);
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
                    <FramesButton type='primary' onClick={() => startSession(playPause)}
                                  icon={connected ? 'play' : undefined}
                                  label={connected ? 'start session' : 'connecting...'}/>
                    <FramesButton type='secondary' label={'leave session'}
                                  onClick={() => endSession(playPause, response)}/>
                </div>
            </div>
        )

    else return null;
}

export default memo(GroupWatchHandler)

export const GroupWatchSlide = memo(() => {
    const base = useBase();
    const globalUsers = useUsers();
    const [section, setSection] = useRecoilState(GroupWatchSection)
    const {inviteUser} = useNotifications();
    const {closeGroupWatch, sendMessage, connected, room, users} = useGroupWatch();

    return (
        <SideBar atomName={'GroupWatchSlider'} topic={'GroupWatch'} close={closeGroupWatch}>
            <ul className={ss.pckr}>
                <li className={section === 0 ? ss.actv : ''} onClick={() => setSection(0)}>online</li>
                <li className={section === 1 ? ss.actv : ''} onClick={() => setSection(1)}>connected</li>
                <li className={section === 2 ? ss.actv : ''} onClick={() => setSection(2)}>chat</li>
            </ul>
            <div className={ss.cnt}>
                {section === 0 && <GlobalOnline {...{base, room, inviteUser, users: globalUsers}}/>}
                {section === 1 && <GroupWatchOnline {...{base, users, room}}/>}
                {section === 2 && <GroupWatchActivity {...{base, connected, send: sendMessage}}/>}
            </div>
        </SideBar>
    )
})

const GlobalOnline = memo(({
                          base,
                          inviteUser,
                          room,
                          users
                      }: { users: PresenceInterface[], base: BaseClass, room: string, inviteUser: (address: string, username: string) => Promise<void> }) => {
    const {copy} = useClipboard();
    const {getBaseUrl} = useBasics();
    const saveToClipboard = useCallback(async () => {
        const url = getBaseUrl() + `/room=${room}`;
        await copy(url, 'Video Session url copied to clipboard');
    }, [copy, getBaseUrl, room]);

    if (users.length < 1)
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
            {users.map(user => (
                <div className={`${ss.chtMsgItm} ${ss.hvr}`} key={user.phx_ref}
                     onClick={() => inviteUser(user.reference, user.username)}>
                    <div className={`${ss.atr} ${user.presenceState === 'away' ? ss.away : user.presenceState.includes('watching') ? ss.streaming : ss.online}`}>
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
})

const GroupWatchOnline = memo(({
                              base,
                              room,
                              users,
                          }: {users: PresenceInterface[], room: string, base: BaseClass }) => {
    const {copy} = useClipboard();
    const {getBaseUrl} = useBasics();

    const saveToClipboard = useCallback(async () => {
        const url = getBaseUrl() + `/room=${room}`;
        await copy(url, 'Video Session url copied to clipboard');
    }, [copy, getBaseUrl, room]);

    if (users.length < 1)
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
            {users.map(user => (
                <div className={ss.chtMsgItm} key={user.phx_ref}>
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
                </div>
            ))}
        </div>
    )
})

const GroupWatchActivity = memo(({
                                send,
                                connected,
                                base,
                            }: {connected: boolean, send: (message: Message) => void, base: BaseClass }) => {
    const messages = useRecoilValue(GroupWatchMessages);
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"})
    }, [messagesEndRef]);

    const sendMessage = useCallback(() => {
        if (message.length > 0 && connected) {
            send({data: message, action: 'says'});
            setMessage('');
            inputRef.current?.blur();
        }
    }, [message, connected, send, scrollToBottom]);

    const generateStyles = useCallback((message: GroupWatchMessagesInterface) => {
        let styles = ss.msg;
        styles = `${styles} ${message.isUser ? ss.isUser : ''}`;
        styles = `${styles} ${message.isNotification ? ss.notification : ''}`;
        return styles;
    }, []);

    useEventListener('keyup', event => {
        if (event.code === 'Enter')
            sendMessage();
    })

    subscribe(scrollToBottom, messages);

    return (
        <>
            <div className={ss.chtMsg}>
                {messages.map((msg, i) => (
                    <div key={i} className={generateStyles(msg)}>
                        <div className={ss.msgUsr}>{msg.username}</div>
                        <div>{msg.message}</div>
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
})
