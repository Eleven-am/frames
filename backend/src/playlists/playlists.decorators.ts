import { Playlist, PlaylistVideo } from '@prisma/client';

import { getHTTPCurrentData } from '../utils/helper.fp';
import { ApiParamId } from '../utils/utils.decorators';


export const CurrentPlaylist = getHTTPCurrentData<{playlist: Playlist}>(
    (request) => request.playlist,
    'Playlist',
);

export const CurrentPlaylistVideo = getHTTPCurrentData<{playlistVideo: PlaylistVideo}>(
    (request) => request.playlistVideo,
    'PlaylistVideo',
);

export const ApiPlaylistId = (description: string) => ApiParamId('playlist', description);

