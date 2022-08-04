import {SideBar, SideBarAtomFamily} from "../../misc/sidebar";
import React, {useCallback, useState} from "react";
import {useRecoilValue, useSetRecoilState} from "recoil";
import ss from "./controls.module.css";
import sss from "../../misc/MISC.module.css";
import {
    framesSubtitlesAtom,
    framesVideoStateAtom,
    SubtitlesSyncAtom,
    useRightControls
} from "../../../../utils/playback";
import {useManageUserInfo} from "../../../../utils/modify";
import {useConfirmDispatch} from "../../../../utils/notifications";
import {subscribe} from "../../../../utils/customHooks";

export default function Settings() {
    const player = useRightControls();
    const user = useManageUserInfo();
    const infoDispatch = useConfirmDispatch();
    const setSubSync = useSetRecoilState(SubtitlesSyncAtom);
    const [subTime, setSubTime] = useState(0);
    const response = useRecoilValue(framesVideoStateAtom);
    const [visible, setVisible] = useState(true);
    const activeSub = useRecoilValue(framesSubtitlesAtom).activeSub;
    const setState = useSetRecoilState(SideBarAtomFamily('framesSettings'));

    subscribe(({activeSub, subTime}) => {
        setSubSync(prev => {
            const sync = (subTime * 1000) - 50;
            const temp = prev.filter(s => s.language !== activeSub);
            temp.push({language: activeSub, sync});
            return temp;
        })
    }, {activeSub, subTime});

    const handleGroup = async (b: boolean) => {
        infoDispatch({
            type: 'error',
            heading: 'Feature not available',
            message: 'This feature is currently not available'
        })
    }

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
                        <div style={{
                            color: 'rgba(255, 255, 255, .9)',
                            fontWeight: 'bold',
                            padding: '10px',
                            fontSize: '20px'
                        }} onClick={() => setSubTime(e => e + 1)}>+
                        </div>
                        <input className={sss.select} value={subTime} type="number" style={{width: '90%'}}
                               onChange={e => setSubTime(+e.currentTarget.value)}/>
                        <div style={{
                            color: 'rgba(255, 255, 255, .9)',
                            fontWeight: 'bold',
                            padding: '10px',
                            fontSize: '20px'
                        }} onClick={() => setSubTime(e => e - 1)}>-
                        </div>
                    </div>
                </div>
                <div className={ss.sqr}>
                    <div className={ss.hdr}>Save player activity</div>
                    <ul className={ss.sel}>
                        <li className={user.settings?.inform ? ss.active : ''} onClick={() => user.goIncognito(true)}>
                            archive
                        </li>
                        <li className={!user.settings?.inform ? ss.active : ''} onClick={() => user.goIncognito(false)}>
                            incognito
                        </li>
                    </ul>

                    <div className={ss.hdr}>GroupWatch</div>

                    <ul className={ss.sel}>
                        <li className={visible ? ss.active : ''} onClick={() => handleGroup(true)}>
                            visible
                        </li>
                        <li className={!visible ? ss.active : ''} onClick={() => handleGroup(false)}>
                            hidden
                        </li>
                    </ul>

                    <div className={ss.hdr}>Autoplay</div>

                    <ul className={ss.sel}>
                        <li className={user.settings?.autoplay ? ss.active : ''} onClick={() => user.setAutoPlay(true)}>
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