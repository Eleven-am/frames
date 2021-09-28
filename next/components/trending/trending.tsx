import styles from "./Trending.module.css";
import Backdrop from "./backdrop/backdrop";
import {useLoop, useReset} from "../../states/homeContext";
import {useEffect} from "react";
import {Banner} from "../../../server/classes/springboard";

export default function Trending({response}: { response: Banner[] }) {
    const reset = useReset();
    const {current, prev} = useLoop({start: 0, end: response.length});

    useEffect(() => {
        return () => reset();
    }, [])

    return (
        <div>
            {response.map((item, index) =>
                index === current || index === prev ?
                    <div key={index} className={index === current ? styles.active : styles.slide}>
                        <Backdrop key={item.id} data={item}/>
                    </div> :
                    null
            )}
        </div>
    );
}