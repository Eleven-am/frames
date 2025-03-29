import { useEffect, useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { MetadataSchema, PresenceAction } from '@/api/data-contracts';
import { ErrorClient } from '@/components/errorClient';
import { Loading } from '@/components/loading-set/Loading';
import { MediaInfoDesktop } from '@/components/media/mediaInfoDesktop';
import { MediaMobile } from '@/components/media/mediaInfoMobile';
import { Player } from '@/components/player';
import { useBlurActions } from '@/providers/blurProvider';
import { useNotificationActions, useNotificationState } from '@/providers/notificationChannel';
import { mediaQueries } from '@/queries/media';
import { createStyles, generateCompleteStyles } from '@/utils/colour';


interface MediaPageProps {
    mediaId: string;
}

export function MediaPageComponent ({ mediaId }: MediaPageProps) {
    const { setBlur } = useBlurActions();
    const { updatePresence } = useNotificationActions();
    const { data: details } = useQuery(mediaQueries.user(mediaId));
    const { data: media, isLoading } = useQuery(mediaQueries.details(mediaId));
    const connected = useNotificationState((state) => state.connected);

    const presence = useMemo((): MetadataSchema | null => {
        if (!media) {
            return null;
        }

        return {
            name: media.name,
            backdrop: media.backdrop,
            poster: media.poster,
            overview: media.overview,
            logo: media.logo,
            mediaId: media.id,
            playbackId: null,
            backdropBlur: media.backdropBlur,
            action: PresenceAction.BROWSING,
        };
    }, [media]);

    useEffect(() => {
        if (connected && presence) {
            updatePresence(presence);
        }
    }, [connected, presence, updatePresence]);

    useEffect(() => {
        if (media) {
            setBlur(media.backdropBlur);
        }
    }, [media, setBlur]);

    if (isLoading) {
        return <Loading />;
    }

    if (!media) {
        return <ErrorClient
            title={'Movie not found'}
            message={'The movie you are looking for does not exist'}
        />;
    }

    return (
        <Player
            key={mediaId}
            name={media.name}
            style={
                {
                    ...generateCompleteStyles(media.posterBlur, media.backdropBlur, media.logoBlur),
                    ...createStyles(media.backdropBlur, [7.4, 7.6, 7.8], true),
                }
            }
        >
            <MediaInfoDesktop media={media} details={details} key={`${mediaId}-desktop`} />
            <MediaMobile media={media} details={details} key={`${mediaId}-mobile`} />
        </Player>
    );
}
