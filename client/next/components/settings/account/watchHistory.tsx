import {useInfiniteScroll} from "../../../../utils/customHooks";
import {Link, Loading} from "../../misc/Loader";
import ss from "../ACCOUNT.module.css";
import {Settings} from "../manage/library";
import {useManageUserInfo} from "../../../../utils/modify";
import {WatchHistory} from "../../../../../server/classes/playback";
import {useConfirmDispatch} from "../../../../utils/notifications";
import {useCallback} from "react";

export interface UserSettings<S> extends Settings<S> {
    timestamp: string;
    location: string;
    position?: number;
    logo?: string | null;
}

export function UserResponse<S>(obj: UserSettings<S>) {

    return (
        <div className={ss.d}>
            <div className={ss.inDX}>
                <Link href={obj.location}>
                    <img src={obj.backdrop} className={ss.usrImg} alt={obj.name}/>
                    <div style={obj.position && obj.position > 0 ? {display: "block"} : {}} className={ss.e}>
                        <div className={ss.fill} style={{width: obj.position + '%'}}/>
                    </div>
                    <div className={ss.lg}
                         style={obj.logo === null ? {top: '27%'} : obj.logo === undefined ? {display: 'none'} : {}}>
                        {obj.logo ? <img src={obj.logo} alt={obj.name}/> : obj.logo === null ?
                            <span>{obj.name}</span> : null}
                    </div>
                </Link>
                <div onClick={() => obj.onClick(obj.id)}>
                    <div className={ss.h}>
                        <div className={ss.clr}>
                            <div className={ss.c}>{obj.name}</div>
                            <div className={ss.f}>{obj.timestamp}</div>
                        </div>
                        <svg className={ss.dSvg} viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="1"/>
                            <circle cx="12" cy="5" r="1"/>
                            <circle cx="12" cy="19" r="1"/>
                        </svg>
                    </div>
                    <div className={ss.p}>{obj.overview}</div>
                </div>
            </div>
        </div>
    )
}

export default function WatchedList() {
    const confirmAction = useConfirmDispatch();
    const {deleteWatchEntry} = useManageUserInfo();
    const {
        data: response,
        setData: setResponse,
        handleScroll
    } = useInfiniteScroll<WatchHistory>('/api/modify/watchHistory?limit=75');

    const onClick = useCallback((id: number) => {
        confirmAction({
            type: 'warn',
            heading: "Delete watch entry?",
            message: "Are you sure you want to delete this watch entry?",
            onOk: () => deleteWatchEntry(id, setResponse),
            confirmText: "Delete",
            cancelText: "Cancel",
            confirm: true
        });
    }, [deleteWatchEntry, confirmAction, setResponse]);

    if (response.length < 1)
        return <Loading/>

    return (
        <div className={ss.data} onScroll={handleScroll}>
            <div className={ss.grid2}>
                {(response || []).map(e => {
                    const obj: UserSettings<number> = {
                        id: e.watchedId,
                        name: e.name,
                        timestamp: e.timeStamp,
                        position: e.position,
                        overview: e.overview,
                        backdrop: e.backdrop,
                        location: e.location,
                        onClick: onClick,
                    };

                    return <UserResponse key={e.watchedId} {...obj} />;
                })}
            </div>
        </div>
    )
}
