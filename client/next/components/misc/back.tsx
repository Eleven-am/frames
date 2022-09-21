import style from "./back.module.css";
import authStyle from '../auth/Auth.module.css';
import {useLoop} from "../../../utils/customHooks";
import {memo, useCallback, useEffect, useMemo} from "react";
import {atom, useRecoilState} from "recoil";
import useBase from "../../../utils/provider";

const BackgroundImagesAtom = atom({
    key: 'backgroundImage',
    default: [] as string[]
});

const useGetBackgroundImages = (images: string[] = []) => {
    const base = useBase();
    const [backgroundImages, setBackgroundImages] = useRecoilState(BackgroundImagesAtom);

    const fetcher = useCallback(() => {
        if (backgroundImages.length === 0)
            base.makeRequest<string[]>('/api/stream/getTrendingImages', null)
                .then(response => setBackgroundImages(response || images))

    }, [base, images, setBackgroundImages, backgroundImages.length])

    useEffect(() => {
        fetcher();
    }, []);

    return useMemo(() => (images.length > 0 ? images : backgroundImages), [images, backgroundImages]);
};

const Background = memo(({response, auth}: { auth?: boolean, response?: string[] }) => {
    const images = useGetBackgroundImages(response);
    const {current, prev, switchTo} = useLoop({start: 0, end: images.length});

    useEffect(() => {
        switchTo(current, images.length);
    }, [images]);

    const styles = useMemo(() => auth ? authStyle : style, [auth]);

    return (
        <div className={styles['login-img']}>
            {images.map((link, index) =>
                index === current || index === prev ?
                    index === prev ?
                        <img key={index} src={link} alt="" className={styles['fade_img']}/> :
                        <img key={index} src={link} alt="" className={styles['glow_img']}/> :
                    null
            )}
        </div>
    );
});

export default Background;
