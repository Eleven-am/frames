import {atom, selector, useResetRecoilState} from 'recoil';
import {DetailedEpisode, EpisodeInterface} from "../../server/classes/episode";

export const infoTrailerContext = atom({
    key: 'infoTrailerContext',
    default: false
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

export const InfoSeasonsContext = atom<EpisodeInterface[]>({
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
            const res = await fetch(`/api/media/episodes?id=${media}&season=${season}`);
            const seasons: DetailedEpisode[] = await res.json();
            return {seasons, section};
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
    const trailer = useResetRecoilState(infoTrailerContext);
    const season = useResetRecoilState(InfoSeasonsContext);
    const media = useResetRecoilState(InfoMediaIdContext);
    const section = useResetRecoilState(InfoSectionContext);
    const sections = useResetRecoilState(InfoSectionsContext);

    return () => {
        trailer();
        section();
        season();
        media();
        sections();
    }
}