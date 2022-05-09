import HomeLayout from "../client/next/components/navbar/navigation";
import {useDetectPageChange, useFetcher, useNavBar} from "../client/utils/customHooks";
import {Loading} from "../client/next/components/misc/Loader";
import Browse from "../client/next/components/browse";
import {useEffect} from "react";
import useOnScroll from "../client/utils/opacityScroll";
import {Banner} from "../server/serverFunctions/load";

export default function Library () {
    const {reset} = useOnScroll();
    const {loading, router} = useDetectPageChange(true);
    const type = router.asPath.includes('movies') ? 'movies' : 'tv shows';
    const unit = router.asPath.includes('movies') ? 'movies' : 'shows';
    useNavBar(type, 1);
    const {response: banner, loading: loading2} = useFetcher<Banner[]>(`/api/load/library?value=${unit}`);

    useEffect(() => {
        loading && reset();
    } , [loading]);

    if (loading || loading2)
        return (
            <HomeLayout>
                <Loading/>
            </HomeLayout>
        );

    return (
        <HomeLayout>
            {banner && <Browse banner={banner}/>}
        </HomeLayout>
    )
}