import {useInfiniteScroll} from "../../../../utils/customHooks";
import {useManageUserInfo} from "../../../../utils/modify";
import {MyList} from "../../../../../server/classes/modify";
import {Loading} from "../../misc/Loader";
import ss from "../ACCOUNT.module.css";
import {UserResponse, UserSettings} from "./watchHistory";
import {useConfirmDispatch} from "../../misc/inform";

export default function YourList() {
    const confirmAction = useConfirmDispatch();
    const {deleteFromMyList} = useManageUserInfo();
    const {
        data: response,
        setData: setResponse,
        handleScroll
    } = useInfiniteScroll<MyList>('/api/modify/myList?limit=75');

    const onClick = (id: number) => {
        confirmAction({
            type: 'client',
            heading: "Delete watch entry?",
            message: "Are you sure you want to delete this watch entry?",
            onOk: async () => {
                await deleteFromMyList(id, setResponse);
            },
            onCancel() {
                console.log("Cancel");
            },
            confirm: true,
            confirmText: "Delete",
            cancelText: "Cancel"
        });
    }

    if (response.length < 1)
        return <Loading/>

    return (
        <div className={ss.data} onScroll={handleScroll}>
            <div className={ss.grid2}>
                {(response || []).map(e => {
                    const obj: UserSettings<number> = {
                        id: e.id,
                        name: e.name,
                        timestamp: e.timeStamp,
                        position: 0,
                        overview: e.overview,
                        backdrop: e.backdrop,
                        logo: e.logo,
                        location: e.location,
                        onClick: onClick,
                    };

                    return <UserResponse key={e.id} {...obj} />;
                })}
            </div>
        </div>
    )
}