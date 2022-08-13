import {atom, selector, useRecoilState, useResetRecoilState} from 'recoil';
import {SpringMedUserSpecifics} from "../../../../server/classes/user";
import {SpringMedia} from "../../../../server/classes/media";
import useNotifications from "../../../utils/notifications";
import React, {useCallback} from "react";
import useBase from "../../../utils/provider";
import {mutate} from "swr";
import {MediaType} from "@prisma/client";

export const InfoContext = atom<SpringMedia | null>({
    key: 'InfoContext',
    default: null
})

export const InfoSeasonContext = selector({
    key: 'InfoSeasonContext',
    get: ({get}) => {
        const section = get(InfoSectionContext);
        if (!/^Season\s\d+/.test(section))
            return 0;

        else
            return parseInt(section.replace(/^Season\s/, ''));
    }
})

export const infoUserContext = atom<SpringMedUserSpecifics | null>({
    key: 'infoUserContext',
    default: null
})

export const InfoSectionContext = atom({
    key: 'InfoSectionContext',
    default: '1'
})

export const InfoSectionsContext = atom<string[]>({
    key: 'InfoSectionsContext',
    default: []
})

export const InfoEpisodesContext = selector({
    key: 'InfoEpisodesContext',
    get: async ({get}) => {
        const info = get(InfoContext);
        const defSeasons = info?.seasons ?? [];
        const season = get(InfoSeasonContext);
        const media = info?.id ?? 0;
        const section = get(InfoSectionContext);
        if (season === 0)
            return {seasons: defSeasons, section};

        else {
            try {
                const res = await fetch(`/api/media/episodes?mediaId=${media}&season=${season}`);
                const seasons: any[] = await res.json();
                return {seasons, section};
            } catch (e) {
                console.log(e);
                return {section, seasons: []};
            }
        }
    }
})

export const InformSeasonContext = selector<string[]>({
    key: 'InformSeasonContext',
    get: ({get}) => {
        const defSeasons = get(InfoContext)?.seasons ?? [];
        const sections = get(InfoSectionsContext);
        const season = get(InfoSeasonContext);
        return season === 0 ? sections : defSeasons.map(e => e.name);
    }, set: ({set}, newValue) => set(InfoSectionsContext, newValue)
})

export const resetInfo = () => {
    const section = useResetRecoilState(InfoSectionContext);
    const sections = useResetRecoilState(InfoSectionsContext);
    const info = useResetRecoilState(infoUserContext);
    const media = useResetRecoilState(InfoContext);
    const {modifyPresence} = useNotifications();

    return () => {
        section();
        sections();
        info();
        media();
        modifyPresence('online');
    }
}

export const useInfoContext = () => {
    const base = useBase();
    const [info, setInfo] = useRecoilState(InfoContext);
    const [infoUser, setInfoUser] = useRecoilState(infoUserContext);

    const getUserInfo = useCallback(async () => {
        const data = await base.makeRequest<SpringMedUserSpecifics>('/api/media/specificUserData', {mediaId: info?.id});
        setInfoUser(data);
    }, [base, info]);

    const updateInfo = useCallback(async () => {
        const moddedMedia = await base.makeRequest<SpringMedia>('/api/modify/getModdedMedia', {mediaId: info?.id}, 'POST');
        setInfo(moddedMedia);
    }, [base, info]);

    const toggleSeen = useCallback(async () => {
        if (!info)
            return;

        if (infoUser) {
            const seen = !infoUser.seen;
            setInfoUser({...infoUser, seen});
        }
        await fetch(`/api/media/seen?mediaId=${info.id}`);
        await mutate('/api/load/continue')
        if (info.type !== MediaType.MOVIE)
            await updateInfo();
    }, [info, infoUser, updateInfo]);

    const toggleAddToList = useCallback(async () => {
        if (!info)
            return;

        if (infoUser) {
            const myList = !infoUser.myList;
            setInfoUser({...infoUser, myList});
        }
        await fetch(`/api/media/addToList?mediaId=${info.id}`);
        await mutate('/api/load/myList');
    }, [info, infoUser, setInfoUser]);

    const rateMedia = useCallback(async (event: React.MouseEvent) => {
        const box = event.currentTarget.getBoundingClientRect();
        const rating = ((event.clientX - box.left) / (box.right - box.left)) * 100;
        if (!info)
            return;

        if (infoUser)
            setInfoUser({...infoUser, rating: `${rating}%`});
        await fetch(`/api/media/rate?mediaId=${info.id}&rate=${Math.floor(rating / 10)}`);
    }, [info, infoUser, setInfoUser]);

    return {getUserInfo, updateInfo, toggleSeen, toggleAddToList, rateMedia}
}
