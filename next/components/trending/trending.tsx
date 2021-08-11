import styles from "./Trending.module.css";
import Backdrop from "./backdrop/backdrop";
import {useLoop, useReset} from "../../states/homeContext";
import {useEffect} from "react";
import {Banner} from "../../../server/classes/springboard";

export default function Trending({response}: { response: Banner[] }) {
    const reset = useReset();
    const current = useLoop({start: 0, end: response.length});

    useEffect(() => {
        return () => reset();
    }, [])

    return (
        <div>
            {response.map((item, index) => {
                return (
                    <div key={index} className={index === current ? styles.active : styles.slide}>
                        {index !== current ? (
                            current === 0 && index === response.length - 1 ? (
                                <Backdrop key={item.id} data={item}/>
                            ) : index === current - 1 ? (
                                <Backdrop key={item.id} data={item}/>
                            ) : null
                        ) : null}
                        {index === current ? (
                            <Backdrop key={item.id} data={item}/>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}