import {
    User as ModelUser,
    PickItem,
    PickCategory,
    AuthKey,
    Room,
    Media,
    Rating,
    Session,
    ListItem,
    SeenMedia,
    Playlist,
    PlaylistVideo,
    Frame,
    View,
    Watched,
    Download,
    CloudStorage,
    OauthClient,
    Config,
    Subtitle,
} from '@prisma/client';

import { StreamItem } from '../stream/stream.schema';

declare module '@eleven-am/authorizer' {
    interface SubjectTypes {
        User: ModelUser;
        AuthKey: AuthKey;
        Room: Room;
        Media: Media;
        PickItem: PickItem;
        PickCategory: PickCategory;
        Rating: Rating;
        Session: Session;
        ListItem: ListItem;
        SeenMedia: SeenMedia;
        Playlist: Playlist;
        PlaylistVideo: PlaylistVideo;
        Frame: Frame;
        View: View;
        Watched: Watched;
        Download: Download;
        CloudStorage: CloudStorage;
        Oauth: OauthClient;
        Stream: StreamItem;
        Config: Config;
        Subtitle: Subtitle;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends ModelUser {}
}
