import React from "react";
import Media from "./media";
import {DetailedEpisode} from "../../../../server/classes/episode";

export default function Editor({data}: {data: DetailedEpisode }) {
  return (
    <li>
      <Media media={false} data={data} />
    </li>
  );
}
