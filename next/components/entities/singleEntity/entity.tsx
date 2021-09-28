import {MediaType} from '@prisma/client';
import {MediaSection} from "../../../../server/classes/media";
import {FramesLink as Link} from "../../misc/Loader";

export default function Entity({poster, id, type, name, background}: MediaSection) {
    let url = "/" + (type === MediaType.MOVIE ? "movie" : "show") + "=" + name.replace(/\s/g, "+");

    return (
        <Link href={'/info?id=' + id} as={url}>
            <li>
                <img src={poster} style={background ? {objectFit: "contain", background} : {}} alt={name}/>
            </li>
        </Link>
    );
}
