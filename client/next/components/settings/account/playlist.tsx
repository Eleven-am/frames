import ss from "../ACCOUNT.module.css";
import {Template} from "../../buttons/Buttons";
import {useFetcher} from "../../../../utils/customHooks";
import {FramesPlaylist} from "../../../../../server/classes/listEditors";
import {Loading} from "../../misc/Loader";
import {UserResponse, UserSettings} from "./watchHistory";
import usePlaylist from "../../misc/editPlaylist";

export default function UserPlaylist(){
    const {pushPlaylist} = usePlaylist();
    const {loading, response} = useFetcher<FramesPlaylist[]>('/api/settings/getPlaylists', {
        refreshInterval: 1000 * 60 * 5,
    });

    const onClick = (playlist: FramesPlaylist) => {
        pushPlaylist(['overview', 'videos'], playlist.identifier);
    }

    if (loading && !response) return <Loading/>

    return (
        <div className={ss.data}>
            <div className={ss.searchContainer}>
                <Template id={1} type={'add'} name={`create new playlist`} onClick={() => pushPlaylist(['overview', 'videos'], null)}/>
            </div>
            <div className={ss.grid2}>
                {response?.map(e => {
                    const obj: UserSettings<FramesPlaylist> = {
                        id: e,
                        name: e.name,
                        timestamp: e.timestamp,
                        position: 0,
                        overview: e.overview || '',
                        backdrop: e.backdrop,
                        logo: e.logo,
                        location: e.location,
                        onClick: onClick,
                    };

                    return <UserResponse key={e.identifier} {...obj} />;
                })}
            </div>
        </div>
    )
}