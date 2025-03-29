import { Api } from '@/api/Api';
import { MediaControllerGetIdFromQueryParamsTypeEnum, MediaType, HttpExceptionSchema } from '@/api/data-contracts';
import { HttpResponse } from '@/api/http-client';
import { createQueries } from '@/queries/base';

interface BeforeLoadMediaResponse {
    to: '/movie/$mediaId' | '/show/$mediaId';
    params: {
        mediaId: string;
    };
    mask: {
        to: string;
    };
}

interface BeforeLoadPersonResponse {
    to: '/person/$personId';
    params: {
        personId: string;
    };
    mask: {
        to: string;
    };
}

interface BeforeLoadCollectionResponse {
    to: '/collection/$collectionId';
    params: {
        collectionId: string;
    };
    mask: {
        to: string;
    };
}

interface BeforeLoadCompanyResponse {
    to: '/company/$companyId';
    params: {
        companyId: string;
    };
    mask: {
        to: string;
    };
}

interface BeforeLoadRoomResponse {
    to: '/rooms/$roomId';
    params: {
        roomId: string;
    };
    mask: {
        to: string;
    };
}

interface BeforeLoadWatchResponse {
    to: '/watch';
    search: {
        playbackId: string;
    };
    mask: {
        to: string;
    };
}

interface BeforeLoadFrameResponse {
    to: '/watch';
    search: {
        frame: string;
    };
    mask: {
        to: string;
    };
}

interface BeforeLoadPlaylistResponse {
    to: '/playlist/$playlistId';
    params: {
        playlistId: string;
    };
    mask: {
        to: string;
    };
}

type BeforeLoadResponse = BeforeLoadMediaResponse | BeforeLoadPersonResponse | BeforeLoadCollectionResponse | BeforeLoadCompanyResponse | BeforeLoadRoomResponse | BeforeLoadWatchResponse | BeforeLoadFrameResponse | BeforeLoadPlaylistResponse;

async function beforeLoad (href: string, client: Api<never>): Promise<HttpResponse<BeforeLoadResponse, HttpExceptionSchema>> {
    const mediaRegex = /\/([ms])=(.*)/;
    const personRegex = /\/p=(.*)/;
    const collectionRegex = /\/col=(.*)/;
    const companyRegex = /\/c=(.*)/;
    const roomRegex = /\/r=(.*)/;
    const watchRegex = /\/w=(.*)/;
    const frameRegex = /\/f=(.*)/;
    const playlistRegex = /\/pl=(.*)/;

    const mediaMatch = href.match(mediaRegex);
    const personMatch = href.match(personRegex);
    const collectionMatch = href.match(collectionRegex);
    const companyMatch = href.match(companyRegex);
    const roomMatch = href.match(roomRegex);
    const watchMatch = href.match(watchRegex);
    const frameMatch = href.match(frameRegex);
    const playlistMatch = href.match(playlistRegex);

    if (mediaMatch) {
        const [_, type, mediaName] = mediaMatch;
        const mediaType = type === 'm' ? MediaType.MOVIE : MediaType.SHOW;
        const name = mediaName.replace(/\+/g, ' ');

        const { data: response, error } = await client.mediaControllerFuzzySearch({
            query: name,
        });

        if (error) {
            return {
                error,
            } as HttpResponse<BeforeLoadResponse, HttpExceptionSchema>;
        }


        const media = response.find((media) => media.type === mediaType && media.name.toLowerCase() === name.toLowerCase());

        if (media) {
            return {
                data: {
                    to: media.type === MediaType.MOVIE ? '/movie/$mediaId' : '/show/$mediaId' as const,
                    params: {
                        mediaId: media.id,
                    },
                    mask: {
                        to: href,
                    },
                },
            } as HttpResponse<BeforeLoadMediaResponse, HttpExceptionSchema>;
        }
    }

    if (personMatch) {
        const [_, personName] = personMatch;
        const name = personName.replace(/\+/g, ' ');

        const { data: response, error } = await client.mediaControllerGetIdFromQuery({
            type: MediaControllerGetIdFromQueryParamsTypeEnum.Person,
            query: name,
        });

        if (error) {
            return {
                error,
            } as HttpResponse<BeforeLoadResponse, HttpExceptionSchema>;
        }

        return {
            data: {
                to: '/person/$personId' as const,
                params: {
                    personId: response.id,
                },
                mask: {
                    to: href,
                },
            },
        } as HttpResponse<BeforeLoadPersonResponse, HttpExceptionSchema>;
    }

    if (collectionMatch) {
        const [_, collectionName] = collectionMatch;
        const name = collectionName.replace(/\+/g, ' ');

        const { data: response, error } = await client.mediaControllerGetIdFromQuery({
            type: MediaControllerGetIdFromQueryParamsTypeEnum.Collection,
            query: name,
        });

        if (error) {
            return {
                error,
            } as HttpResponse<BeforeLoadResponse, HttpExceptionSchema>;
        }

        return {
            data: {
                to: '/collection/$collectionId' as const,
                params: {
                    collectionId: response.id,
                },
                mask: {
                    to: href,
                },
            },
        } as HttpResponse<BeforeLoadCollectionResponse, HttpExceptionSchema>;
    }

    if (companyMatch) {
        const [_, companyName] = companyMatch;
        const name = companyName.replace(/\+/g, ' ');

        const { data: response, error } = await client.mediaControllerGetIdFromQuery({
            type: MediaControllerGetIdFromQueryParamsTypeEnum.Company,
            query: name,
        });

        if (error) {
            return {
                error,
            } as HttpResponse<BeforeLoadResponse, HttpExceptionSchema>;
        }

        return {
            data: {
                to: '/company/$companyId' as const,
                params: {
                    companyId: response.id,
                },
                mask: {
                    to: href,
                },
            },
        } as HttpResponse<BeforeLoadCompanyResponse, HttpExceptionSchema>;
    }

    if (roomMatch) {
        const [_, roomId] = roomMatch;

        return {
            data: {
                to: '/rooms/$roomId' as const,
                params: {
                    roomId,
                },
                mask: {
                    to: href,
                },
            },
        } as HttpResponse<BeforeLoadRoomResponse, HttpExceptionSchema>;
    }

    if (watchMatch) {
        const [_, playbackId] = watchMatch;

        return {
            data: {
                to: '/watch' as const,
                search: {
                    playbackId,
                },
                mask: {
                    to: href,
                },
            },
        } as HttpResponse<BeforeLoadWatchResponse, HttpExceptionSchema>;
    }

    if (frameMatch) {
        const [_, frame] = frameMatch;

        return {
            data: {
                to: '/watch' as const,
                search: {
                    frame,
                },
                mask: {
                    to: href,
                },
            },
        } as HttpResponse<BeforeLoadFrameResponse, HttpExceptionSchema>;
    }

    if (playlistMatch) {
        const [_, playlistId] = playlistMatch;

        return {
            data: {
                to: '/playlist/$playlistId' as const,
                params: {
                    playlistId,
                },
                mask: {
                    to: href,
                },
            },
        } as HttpResponse<BeforeLoadPlaylistResponse, HttpExceptionSchema>;
    }

    return {
        error: {
            error: 'No match found',
            message: 'No match found',
            statusCode: 404,
        },
    } as HttpResponse<BeforeLoadResponse, HttpExceptionSchema>;
}

export const miscQueries = createQueries('misc', {
    company: (companyId: string) => ({
        queryKey: [companyId],
        queryFn: (api) => api.mediaControllerGetCompanyById(companyId),
    }),
    person: (personId: string) => ({
        queryKey: [personId],
        queryFn: (api) => api.mediaControllerGetPersonById(personId),
    }),
    collection: (collectionId: string) => ({
        queryKey: [collectionId],
        queryFn: (api) => api.mediaControllerGetCollectionById(collectionId),
    }),
    beforeLoad: (href: string) => ({
        queryFn: (api) => beforeLoad(href, api),
    }),
});
