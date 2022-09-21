import {memo} from "react";
import Media from "./media";

function Editor({data}: { data: any }) {
    return (
        <li>
            <Media media={false} data={data}/>
        </li>
    );
}

export default memo(Editor);
