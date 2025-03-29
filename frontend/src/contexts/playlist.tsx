import { Api } from '@/api/Api';
import {
    HttpExceptionSchema,
    PlaylistDetailsSchema,
    PlaylistDetailsSchemaAccessPolicyEnum,
    PlaylistVideoResponseSchema,
    SearchedVideoSchema,
} from '@/api/data-contracts';
import { HttpResponse } from '@/api/http-client';
import { mediaActions } from '@/queries/media';
import { useAutoSaveAction } from '@eleven-am/xquery';
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

const defaultState: PlaylistDetailsSchema = {
    id: '',
    name: '',
    videos: [],
    author: '',
    overview: '',
    isPublic: false,
    accessPolicy: PlaylistDetailsSchemaAccessPolicyEnum.DELETE,
    updatedAt: (new Date()).toISOString(),
};

interface PlaylistContext {
    canModify: boolean;
    canDelete: boolean;
    isModalOpen: boolean;
    toggleModal: () => void;
    togglePublic: () => void;
    playlist: PlaylistDetailsSchema;
    removeVideo: (id: string) => void;
    changeName: (name: string) => void;
    changeOverview: (overview: string) => void;
    addVideo: (video: SearchedVideoSchema) => void;
    setVideos: (videos: SearchedVideoSchema[]) => void;
    reorderVideos: (items: PlaylistVideoResponseSchema[]) => void;
}

interface PlaylistProviderProps {
    count?: number;
    children: ReactNode;
    initialData?: PlaylistDetailsSchema;
    action: (api: Api<never>, data: PlaylistDetailsSchema) => Promise<HttpResponse<PlaylistDetailsSchema, HttpExceptionSchema>>;
}

const PlaylistContext = createContext<PlaylistContext>({
    canModify: false,
    canDelete: false,
    isModalOpen: false,
    playlist: defaultState,
    addVideo: () => {},
    toggleModal: () => {},
    togglePublic: () => {},
    removeVideo: () => {},
    changeName: () => {},
    changeOverview: () => {},
    reorderVideos: () => {},
    setVideos: () => {},
});

function buildPlaylist (count = 0): PlaylistDetailsSchema {
    return {
        ...defaultState,
        id: crypto.randomUUID(),
        name: `New Playlist ${count}`,
    };
}

export function usePlaylistContext () {
    const context = useContext(PlaylistContext);

    if (!context) {
        throw new Error('usePlaylistContext must be used within a PlaylistProvider');
    }

    return context;
}

export function PlaylistProvider ({ children, action, initialData, count }: PlaylistProviderProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [value, setValue] = useAutoSaveAction({
        delay: 2000,
        options: mediaActions.editPlaylist({
            playlist: initialData || buildPlaylist(count),
            action,
        }),
    });

    const toggleModal = useCallback(() => setIsModalOpen((prev) => !prev), []);
    const removeVideo = useCallback((id: string) => {
        setValue((prev) => ({
            ...prev,
            videos: prev.videos
                .filter((video) => video.id !== id)
                .map((video, index) => ({
                    ...video,
                    index,
                })),
        }));
    }, [setValue]);

    const changeName = useCallback((name: string) => {
        setValue((prev) => ({
            ...prev,
            name,
        }));
    }, [setValue]);

    const changeOverview = useCallback((overview: string) => {
        setValue((prev) => ({
            ...prev,
            overview,
        }));
    }, [setValue]);

    const reorderVideos = useCallback((items: PlaylistVideoResponseSchema[]) => {
        const videos = items.map((item, index) => ({
            ...item,
            index,
        }));

        setValue((prev) => ({
            ...prev,
            videos,
        }));
    }, [setValue]);

    const togglePublic = useCallback(() => {
        setValue((prev) => ({
            ...prev,
            isPublic: !prev.isPublic,
        }));
    }, [setValue]);

    const addVideo = useCallback((video: SearchedVideoSchema) => {
        setValue((prev) => ({
            ...prev,
            videos: [
                ...prev.videos,
                {
                    ...video,
                    playlistId: prev.id,
                    index: prev.videos.length,
                    id: crypto.randomUUID(),
                    updatedAt: (new Date()).toISOString(),
                },
            ],
        }));
    }, [setValue]);

    const setVideos = useCallback((videos: SearchedVideoSchema[]) => {
        setValue((prev) => ({
            ...prev,
            videos: prev.videos.concat(videos.map((video, index) => ({
                ...video,
                playlistId: prev.id,
                index,
                id: crypto.randomUUID(),
                updatedAt: (new Date()).toISOString(),
            }))),
        }));
    }, [setValue]);

    const canModify = useMemo(() => value.accessPolicy === PlaylistDetailsSchemaAccessPolicyEnum.UPDATE || value.accessPolicy === PlaylistDetailsSchemaAccessPolicyEnum.DELETE, [value.accessPolicy]);
    const canDelete = useMemo(() => value.accessPolicy === PlaylistDetailsSchemaAccessPolicyEnum.DELETE, [value.accessPolicy]);

    return (
        <PlaylistContext.Provider
            value={
                {
                    playlist: value,
                    isModalOpen,
                    toggleModal,
                    togglePublic,
                    changeName,
                    changeOverview,
                    removeVideo,
                    reorderVideos,
                    canModify,
                    canDelete,
                    setVideos,
                    addVideo,
                }
            }
        >
            {children}
        </PlaylistContext.Provider>
    );
}
