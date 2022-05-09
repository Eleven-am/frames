import {atom, selector, useResetRecoilState} from 'recoil';
import {SpringMedUserSpecifics} from "../../../../server/classes/media";

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

export const InfoSeasonsContext = atom<any[]>({
    key: 'InfoSeasonsContext',
    default: []
})

export const InfoMediaIdContext = atom({
    key: 'InfoMediaIdContext',
    default: 0
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
        const defSeasons = get(InfoSeasonsContext);
        const season = get(InfoSeasonContext);
        const media = get(InfoMediaIdContext);
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
        const defSeasons = get(InfoSeasonsContext);
        const sections = get(InfoSectionsContext);
        const season = get(InfoSeasonContext);
        return season === 0 ? sections : defSeasons.map(e => e.name);
    }, set: ({set}, newValue) => set(InfoSectionsContext, newValue)
})

export const resetInfo = () => {
    const season = useResetRecoilState(InfoSeasonsContext);
    const media = useResetRecoilState(InfoMediaIdContext);
    const section = useResetRecoilState(InfoSectionContext);
    const sections = useResetRecoilState(InfoSectionsContext);
    const info = useResetRecoilState(infoUserContext);

    return () => {
        section();
        season();
        media();
        sections();
        info();
    }
}