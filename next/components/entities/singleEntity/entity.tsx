import Link from "next/link";
import {MediaType} from '@prisma/client';
import {EditMedia, MediaSection} from "../../../../server/classes/media";
import {useSetRecoilState} from "recoil";
import {EditMediaContext} from "../../misc/editMedia";

export default function Entity({poster, id, type, name, background}: MediaSection) {
    const dispatch = useSetRecoilState(EditMediaContext);
    let url = "/" + (type === MediaType.MOVIE ? "movie" : "show") + "=" + name.replace(/\s/g, "+");
    poster = (/^images\/drive/.test(poster!) ? 'https://drive.google.com/uc?export=view&id=' : '') + poster!.replace('images/drive/', '');

    const getInfo = async (event: any) => {
        event.preventDefault();
        const res = await fetch('/api/update/modifyMedia?id='+id);
        const data: EditMedia = await res.json();
        dispatch(data);
    }

    return (
        <Link href={'/info?id=' + id} as={url}>
            <li onContextMenu={getInfo}>
                <img src={poster} style={background ? {objectFit: "contain", background}: {}} alt={name}/>
            </li>
        </Link>
    );
}
