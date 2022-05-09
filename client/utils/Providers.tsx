import {createContext, ReactNode, useContext, useRef} from "react";
import {Backdrop, BeforeExit} from "../next/components/misc/Loader";
import {GlobalModals} from "../next/components/misc/inform";
import {NotificationHandler} from "./notificationConext";
import {UserContextProvider} from "./userTools";
import {CastContextProvider} from "./castContext";
import {RestAPI} from "../../server/classes/stringExt";
import {GroupWatchSlide} from "../next/components/misc/groupWatchHandler";

const BaseContext = createContext<RestAPI>(new RestAPI());

export default function FramesConsumers({children}: {children: ReactNode}) {
    const base = useRef(new RestAPI());

    return (
        <BaseContext.Provider value={base.current}>
            <UserContextProvider>
                <CastContextProvider>
                    <Backdrop/>
                    <BeforeExit/>
                    <GlobalModals/>
                    {children}
                    <NotificationHandler/>
                    <GroupWatchSlide/>
                </CastContextProvider>
            </UserContextProvider>
        </BaseContext.Provider>
    )
}

export const useBase = () => useContext(BaseContext);
