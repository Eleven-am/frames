import {SideBar, SideBarAtomFamily} from "../../misc/sidebar";
import React, {memo, useCallback, useState} from "react";
import {useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import ss from "./controls.module.css";
import sss from "../../misc/MISC.module.css";
import {
    framesSubtitlesAtom,
    framesVideoStateAtom,
    SubtitlesSyncAtom,
    useRightControls
} from "../../../../utils/playback";
import {useManageUserInfo} from "../../../../utils/modify";
import {HoverContainer} from "../../buttons/Buttons";

function Settings() {
    const player = useRightControls();
    const user = useManageUserInfo();
    const [subSync, setSubSync] = useRecoilState(SubtitlesSyncAtom);
    const [subTime, setSubTime] = useState(0);
    const response = useRecoilValue(framesVideoStateAtom);
    const activeSub = useRecoilValue(framesSubtitlesAtom).activeSub;
    const setState = useSetRecoilState(SideBarAtomFamily('framesSettings'));

    const manageSubTime = useCallback((action: 'add' | 'subtract' | 'value', value?: number) => {
        const time = value && action === 'value' ? value : subTime + (action === 'add' ? 1 : -1);
        const newSub = {language: activeSub, sync: (time * 1000) - 50};
        const newSync = subSync.filter(s => s.language !== activeSub);
        newSync.push(newSub);
        setSubSync(newSync);
        setSubTime(time);
    }, [activeSub, subTime, subSync]);

    const handleClose = useCallback(async () => {
        setState(false);
        await user.getUserDetails();
    }, [setState, user]);

    return (
        <SideBar atomName={'framesSettings'} topic={'Video Options'} close={handleClose}>
            <div className={ss.sdbrHldr}>
                <div className={ss.sqr}>
                    <div className={ss.hdr}>Subtitles Settings</div>
                    <select className={sss.select} value={activeSub} style={{width: '90%'}}
                            onChange={e => player.switchLanguage(e.currentTarget.value)}>
                        <option value="none">None</option>
                        {response?.subs.map(sub => <option value={sub.language} key={sub.lang}>{sub.label}</option>)}
                    </select>
                    <div className={ss.hdr}>Sync Subtitles</div>
                    <div style={{display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%'}}>
                        <HoverContainer style={{
                            color: 'rgba(255, 255, 255, .9)',
                            fontWeight: 'bold',
                            padding: '10px',
                            fontSize: '20px'
                        }} onClick={manageSubTime} state={'add'}>+
                        </HoverContainer>
                        <input className={sss.select} value={subTime} type="number" style={{width: '90%'}}
                               onChange={e => manageSubTime('value', parseInt(e.currentTarget.value))}/>
                        <HoverContainer style={{
                            color: 'rgba(255, 255, 255, .9)',
                            fontWeight: 'bold',
                            padding: '10px',
                            fontSize: '20px'
                        }} onClick={manageSubTime} state={'subtract'}>-
                        </HoverContainer>
                    </div>
                </div>
                <div className={ss.sqr}>
                    <div className={ss.hdr}>Save player activity</div>
                    <ul className={ss.sel}>
                        <li className={user.settings?.inform ? ss.active : ''}
                            onClick={() => user.goIncognito(true)}>
                            archive
                        </li>
                        <li className={!user.settings?.inform ? ss.active : ''}
                            onClick={() => user.goIncognito(false)}>
                            incognito
                        </li>
                    </ul>

                    <div className={ss.hdr}>GroupWatch</div>

                    <ul className={ss.sel}>
                        <li className={!user.settings?.incognito ? ss.active : ''}
                            onClick={() => user.channelIncognito(false)}>
                            visible
                        </li>
                        <li className={user.settings?.incognito ? ss.active : ''}
                            onClick={() => user.channelIncognito(true)}>
                            hidden
                        </li>
                    </ul>

                    <div className={ss.hdr}>Autoplay</div>

                    <ul className={ss.sel}>
                        <li className={user.settings?.autoplay ? ss.active : ''}
                            onClick={() => user.setAutoPlay(true)}>
                            Autoplay
                        </li>
                        <li className={!user.settings?.autoplay ? ss.active : ''}
                            onClick={() => user.setAutoPlay(false)}>
                            No Autoplay
                        </li>
                    </ul>
                </div>
            </div>
        </SideBar>
    )
}

export default memo(Settings);
