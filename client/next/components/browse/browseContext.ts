import {atom, useRecoilState, useSetRecoilState} from "recoil";
import {useBase} from "../../../utils/Providers";
import {Media} from "@prisma/client";
import {useEffect, useState} from "react";
import {useRouter} from "next/router";

const GenreContextAtom = atom<string[]>({
    key: 'genreContext',
    default: [],
})

export const GenreAndDecadeContextAtom = atom<{ genres: string[], decades: string[] }>({
    key: 'genreAndDecadeContext',
    default: {
        genres: [],
        decades: [],
    }
})

export const useGenreContext = () => {
    const [genreContext, setGenreContext] = useRecoilState(GenreContextAtom);

    const manageGenre = (genre: string) => {
        if (genreContext.includes(genre))
            setGenreContext(genreContext.filter(g => g !== genre));

        else setGenreContext([...genreContext, genre]);
    }

    const isGenreSelected = (genre: string) => genreContext.includes(genre);

    return {manageGenre, isGenreSelected};
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

    const manageDecade = (decade: string) => {
        setDecadeContext(d => d === decade ? '' : decade);
    }

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
    const setDefaultGenresAndDecades = useSetRecoilState(GenreAndDecadeContextAtom);
    const [page, setPage] = useState(1);

    const fixGenreAndDecade = async (media: Pick<Media, 'id' | 'type' | 'backdrop' | 'logo' | 'name' | 'genre' | 'release'>[] | null) => {
        if (media) {
            let string: string = media.map(item => item.genre).join(' ');
            let genres = string.replace(/ &|,/g, '').split(' ').map(genre => {
                return {genre};
            }).filter(item => item.genre !== '');
            genres = base.sortArray(base.uniqueId(genres, 'genre'), 'genre', 'asc');

            setDefaultGenresAndDecades(prev => ({
                ...prev,
                genres: genres.map(item => item.genre),
            }));

        } else {
            const data = await base.makeRequest<{ genres: string[], decades: string[] }>('/api/load/genresAndDecades', {mediaType: mediaType});
            if (data)
                setDefaultGenresAndDecades(data);
        }
    }

    const fetchMedia = async () => {
        if (load){
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
    };

    const loadMore = async () => {
        setLoading(true);
        const newMedia = await base.makeRequest<Pick<Media, 'id' | 'type' | 'backdrop' | 'logo' | 'name' | 'genre' | 'release'>[]>(`/api/media/browse?page=${page}`, {
            genres,
            decade,
            mediaType
        }, 'POST');
        if (newMedia) {
            setMedia(prev => [...prev, ...newMedia]);
            setPage(page + 1);

            if (genres.length > 0 || decade !== '')
                await fixGenreAndDecade([...media, ...newMedia]);
            else
                await fixGenreAndDecade(null);
        }
        setLoading(false);
    }

    const reset = () => {
        setDefaultGenresAndDecades({
            genres: [],
            decades: [],
        });
        setDecadeContext('');
        setGenres([]);
        setPage(1);
        setMedia([]);
    }

    useEffect(() => {
        fetchMedia();
    }, [genres, decade, mediaType]);

    const handleScroll = async (event: any) => {
        const bottom = event.target.scrollHeight - event.target.scrollTop - 3000 <= event.target.clientHeight;
        if (bottom && !loading)
            await loadMore();
    }

    return {handleScroll, loading, reset};
}