import {FramesCompany} from "../../../server/classes/media";
import {useEffect, useState} from "react";
import {useLoop} from "../../states/homeContext";
import styles from "./back.module.css";

export default function Background({response}: {response: FramesCompany}) {
    const [images, setImages] = useState<string[]>([]);
    const current = useLoop({start: 0, end: response.images.length});

    useEffect(() =>{
        setImages(response.images);
    }, [response])

    return (
        <>
            <div className={styles['login-img']}>
                {images.map((link, index) => {
                    return index === current ? (
                        <img key={index} src={link} alt="" className={styles['glow_img']}/>
                    ) : index !== current ? (
                        current === 0 && index === images.length - 1 ? (
                            <img key={index} src={link} alt="" className={styles['fade_img']}/>
                        ) : index === current - 1 ? (
                            <img key={index} src={link} alt="" className={styles['fade_img']}/>
                        ) : null
                    ) : null;
                })}
            </div>
        </>
    );
}