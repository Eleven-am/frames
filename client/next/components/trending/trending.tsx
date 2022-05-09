import Backdrop from "./backdrop/backdrop";
import {useEffect} from "react";
import {useReset} from "../homeSection/homeContext";
import {useLoop} from "../../../utils/customHooks";
import {Banner} from "../../../../server/serverFunctions/load";

export default function Trending({response, stop}: {stop: boolean, response: Banner[]}) {
    const {current, prev, set, setPause} = useLoop({start: 0, end: response.length});
    const reset = useReset();

    useEffect(() => {
        return () => reset();
    }, [])

    return (
        <div>
            {response.map((item, index) =>
                <Backdrop key={item.id} length={response.length} set={set} setPause={setPause} stop={stop} data={item} current={current} index={index === current || index === prev ? index === current: null}/>
            )}
        </div>
    );
}