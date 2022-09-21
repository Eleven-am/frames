import {MediaType} from '@prisma/client';
import {Link} from "../../misc/Loader";
import {SpringMedia} from "../../../../../server/classes/media";
import {memo} from "react";

function Entity({poster, id, type, name, background}: SpringMedia) {
    const url = "/" + (type === MediaType.MOVIE ? "movie" : "show") + "=" + name.replace(/\s/g, "+");

    return (
        <Link href={'/info?mediaId=' + id} as={url}>
            <li>
                <img src={poster} style={background ? {objectFit: "contain", background} : {}} alt={name}/>
            </li>
        </Link>
    );
}

export default memo(Entity);
