import ss from './Playlist.module.css';
import {FramesSingularPlaylist} from "../../../../server/classes/playlist";
import React from "react";

const banner: FramesSingularPlaylist = {
    name: 'The Test Playlist',
    identifier: '28b5853b-b4ff-443b-831a-b07f370e5f4a',
    timestamp: '2020-01-01T00:00:00.000Z',
    location: '/watch?identifier=28b5853b-b4ff-443b-831a-b07f370e5f4a',
    shuffleLocation: '/watch?shuffle_playlist=28b5853b-b4ff-443b-831a-b07f370e5f4a',
    overview: 'lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem. lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quidem.',
    media: [{
        identifier: 4510,
        backdrop: 'https://is5-ssl.mzstatic.com/image/thumb/cMMCt0GZt708kXr4drSnpQ/3840x2160.jpg',
        logo: 'https://is4-ssl.mzstatic.com/image/thumb/Features124/v4/e3/14/fe/e314fe90-b37d-844b-787e-2d3e37ba8300/bsl16077554922110248393.png/4292x404.png',
        name: 'Tenet', episodeName: null
    }]
}

export default function PlaylistBanner() {
    return (
        <div className={ss.holder}>
            <img className={ss.bck} src={banner.media[0].backdrop} alt={banner.media[0].name}/>
            <div className={ss.foncer}/>
        </div>
    )
}