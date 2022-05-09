import React from "react";
import Media from "./media";

export default function Editor({data}: {data: any}) {
  return (
    <li>
      <Media media={false} data={data} />
    </li>
  );
}
