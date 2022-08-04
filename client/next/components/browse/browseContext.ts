import {atom, useRecoilState, useSetRecoilState} from "recoil";
import {Media} from "@prisma/client";
import {useCallback, useState} from "react";
import {useRouter} from "next/router";
import useBase from "../../../utils/provider";
import {subscribe} from "../../../utils/customHooks";

const GenreContextAtom = atom<string[]>({
    key: 'genreContext',
    default: [],
})

export const GenreHolderContextAtom = atom({
    key: 'GenreHolderContextAtom',
    default: [] as string[],
})

export const useGenreContext = () => {
    const base = useBase();
    const [genreContext, setGenreContext] = useRecoilState(GenreContextAtom);

    const manageGenre = useCallback((genre: string) => {
        if (genreContext.includes(genre))
            setGenreContext(genreContext.filter(g => g !== genre));

        else setGenreContext([...genreContext, genre]);
    }, [genreContext, setGenreContext]);

    const isGenreSelected = useCallback((genre: string) => genreContext.includes(genre), [genreContext]);

    const clearGenreContext = useCallback(() => setGenreContext([]), [setGenreContext]);

    const addMultipleGenres = useCallback((genres: string[]) => setGenreContext(prev => [...prev, ...genres]), [setGenreContext]);

    const splitGenres = useCallback((genres: string) => {
        clearGenreContext();
        const genreArray = genres.replace(/[,&]/g, '').split(' ').map(g => base.capitalize(g));
        const filteredGenreArray = genreArray.filter(g => g !== '');
        addMultipleGenres(filteredGenreArray);
    }, [clearGenreContext, addMultipleGenres]);

    return {manageGenre, isGenreSelected, clearGenreContext, addMultipleGenres, splitGenres};
}

const DecadeContextAtom = atom<string>({
    key: 'decadeContext',
    default: '',
});

export const MediaContextAtom = atom<Pick<Media, 'id' | 'type' | 'backdrop' | 'logo' | 'name' | 'genre' | 'release'>[]>({
    key: 'MediaContextAtom',
    default: [],
})

export const useDecadeContext = () => {
    const [decadeContext, setDecadeContext] = useRecoilState(DecadeContextAtom);

    const manageDecade = useCallback((decade: string) => {
        setDecadeContext(d => d === decade ? '' : decade);
    }, [setDecadeContext]);

    return {manageDecade, decade: decadeContext};
}

export const useBrowseContext = (load = false) => {
    const base = useBase();
    const router = useRouter();
    const [genres, setGenres] = useRecoilState(GenreContextAtom);
    const [decade, setDecadeContext] = useRecoilState(DecadeContextAtom);
    const [loading, setLoading] = useState(false);
    const [media, setMedia] = useRecoilState(MediaContextAtom);
    const mediaType = router.asPath.includes('movies') ? 'MOVIE' : 'SHOW';
    const setDefaultGenresAndDecades = useSetRecoilState(GenreHolderContextAtom);
    const [page, setPage] = useState(1);

    const fixGenreAndDecade = useCallback(async (media: Pick<Media, 'id' | 'type' | 'backdrop' | 'logo' | 'name' | 'genre' | 'release'>[] | null) => {
        if (media) {
            let string: string = media.map(item => item.genre).join(' ');
            let genres = string.replace(/ &|,/g, '').split(' ').map(genre => {
                return {genre};
            }).filter(item => item.genre !== '');
            genres = base.sortArray(base.uniqueId(genres, 'genre'), 'genre', 'asc');
            setDefaultGenresAndDecades(genres.map(item => item.genre),);

        } else
            setDefaultGenresAndDecades([]);
    }, [setDefaultGenresAndDecades, base]);

    const fetchMedia = useCallback(async () => {
        if (load) {
            setLoading(true);
            const media = await base.makeRequest<Pick<Media, 'id' | 'type' | 'backdrop' | 'logo' | 'name' | 'genre' | 'release'>[]>(`/api/media/browse?page=${1}`, {
                genres,
                decade,
                mediaType
            }, 'POST');
            if (media) {
                setMedia(media);

                if (genres.length > 0 || decade !== '')
                    await fixGenreAndDecade(media);
                else
                    await fixGenreAndDecade(null);

                setPage(2);
            }
            setLoading(false);
        }
    }, [genres, decade, mediaType, fixGenreAndDecade, setMedia, setLoading, setPage, load]);

    const loadMore = useCallback(async () => {
        setLoading(true);
        const newMedia = await base.makeRequest<Pick<Media, 'id' | 'type' | 'backdrop' | 'logo' | 'name' | 'genre' | 'release'>[]>(`/api/media/browse?page=${page}`, {
            genres,
            decade,
            mediaType
        }, 'POST');
        if (newMedia) {
            setMedia(prev => base.uniqueId([...prev, ...newMedia], 'id'));
            setPage(page + 1);

            if (genres.length > 0 || decade !== '')
                await fixGenreAndDecade([...media, ...newMedia]);
            else
                await fixGenreAndDecade(null);
        }
        setLoading(false);
    }, [genres, decade, mediaType, fixGenreAndDecade, setMedia, setLoading, setPage, page]);

    const reset = useCallback(() => {
        setDefaultGenresAndDecades([]);
        setDecadeContext('');
        setGenres([]);
        setPage(1);
        setMedia([]);
    }, [setDefaultGenresAndDecades, setDecadeContext, setGenres, setPage, setMedia]);

    subscribe(fetchMedia, {genres, decade, mediaType})

    const handleScroll = useCallback(async (event: any) => {
        const bottom = event.target.scrollHeight - event.target.scrollTop - 3000 <= event.target.clientHeight;
        if (bottom && !loading)
            await loadMore();
    }, [loading, loadMore]);

    return {handleScroll, loading, reset};
}
