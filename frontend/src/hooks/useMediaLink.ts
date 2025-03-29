import { useMemo, useCallback } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { MediaType } from '@/api/data-contracts';


interface UseMediaLinkOptions {
    id: string;
    name: string;
    type: MediaType;
}

interface MediaLink {
    pathname: '/movie/$mediaId' | '/show/$mediaId';
    params: { mediaId: string };
    mask: { to: string };
}

export enum LinkType {
    PERSON = 'person',
    COMPANY = 'company',
    COLLECTION = 'collection',
}

interface PersonLink {
    pathname: '/person/$personId';
    params: { personId: string };
    mask: { to: string };
}

interface CompanyLink {
    pathname: '/company/$companyId';
    params: { companyId: string };
    mask: { to: string };
}

interface CollectionLink {
    pathname: '/collection/$collectionId';
    params: { collectionId: string };
    mask: { to: string };
}

export interface VerticalInformation {
    tmdbId: number;
    name: string;
    id?: string;
}

function processVerticalInformationLink (type: LinkType, { tmdbId, name, id }: VerticalInformation): PersonLink | CompanyLink | CollectionLink {
    if (type === LinkType.PERSON) {
        return {
            pathname: '/person/$personId',
            params: {
                personId: tmdbId.toString(),
            },
            mask: {
                to: `/p=${name.replaceAll(' ', '+').toLowerCase()}`,
            },
        };
    }

    if (type === LinkType.COMPANY) {
        if (!id) {
            throw new Error('Company id is required');
        }

        return {
            pathname: '/company/$companyId',
            params: {
                companyId: id,
            },
            mask: {
                to: `/c=${name.replaceAll(' ', '+').toLowerCase()}`,
            },
        };
    }

    if (type === LinkType.COLLECTION) {
        return {
            pathname: '/collection/$collectionId',
            params: {
                collectionId: tmdbId.toString(),
            },
            mask: {
                to: `/col=${name.replaceAll(' ', '+').toLowerCase()}`,
            },
        };
    }

    throw new Error('Invalid link type');
}

function processLink ({ id, name, type }: UseMediaLinkOptions): MediaLink {
    if (type === MediaType.MOVIE) {
        return {
            pathname: '/movie/$mediaId',
            params: {
                mediaId: id,
            },
            mask: {
                to: `/m=${name.replaceAll(' ', '+').toLowerCase()}`,
            },
        };
    }

    return {
        pathname: '/show/$mediaId',
        params: {
            mediaId: id,
        },
        mask: {
            to: `/s=${name.replaceAll(' ', '+')
                .toLowerCase()}`,
        },
    };
}

const defaultLink: UseMediaLinkOptions = {
    id: '',
    name: '',
    type: MediaType.MOVIE,
};

export function useMediaLink (props: UseMediaLinkOptions = defaultLink) {
    const navigate = useNavigate();
    const link = useMemo(() => processLink(props), [props]);
    const navigateToLink = useCallback((props: UseMediaLinkOptions) => {
        const { pathname, params, mask } = processLink(props);

        void navigate({
            to: pathname,
            params,
            mask,
        });
    }, [navigate]);

    const navigateTo = useCallback(() => {
        void navigate({
            to: link.pathname,
            params: link.params,
            mask: link.mask,
        });
    }, [navigate, link]);

    return {
        link,
        navigateTo,
        navigateToLink,
    };
}

export function useVerticalInformationLink (type: LinkType, props: VerticalInformation) {
    return useMemo(() => processVerticalInformationLink(type, props), [type, props]);
}

