import {NextApiRequest, NextApiResponse} from "next";
import Media, {gridOpt} from "../classes/media";
import {ListEditors} from "../classes/listEditors";
import PlayBack from "../classes/playBack";
import {MediaType} from "@prisma/client";

export interface Banner {
    id: number;
    name: string;
    logo: string;
    backdrop: string;
    trailer: string;
    overview: string;
    type: MediaType;
}

const media = new Media();
const listEditors = new ListEditors();
const playBack = new PlayBack();

export default async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
    let response: any;
    const type = req.query.type[1];

    switch (type) {
        case 'search':
            const {node, value} = req.query;
            response = await media.search(value as string, node as gridOpt);
            break;

        case 'myList':
            response = await listEditors.getMyList(userId);
            break;

        case 'continue':
            const continueData = await playBack.getContinue(userId);
            response = {
                data: continueData,
                type: 'EDITOR',
                display: 'continue watching'
            }
            break;

        case 'trending':
            const data  = await media.getTrending();
            response = {
                data: data.map(e => {
                    const {id, name, poster, background, type} = e;
                    return {id, name, poster, background, type}
                }),
                type: 'BASIC', display: 'what other people are watching'
            };
            break;

        case 'rated':
            const rData = await media.getTopRated();
            response = {
                data: rData.map(e => {
                    const {id, name, poster, background, type} = e;
                    return {
                        id,
                        name,
                        poster,
                        background,
                        type
                    }
                }),
                type: 'BASIC', display: 'the top rated media right now'
            };
            break;

        case 'popular':
            const pData = await media.getPopular(2);
            response = {
                data: pData.map(e => {
                    const {id, name, poster, background, type} = e;
                    return {
                        id,
                        name,
                        poster,
                        background,
                        type
                    }
                }),
                type: 'BASIC', display: 'the most popular media right now'
            };
            break;

        case 'suggestion':
            response = await playBack.getSuggestions(userId);
            break;

        case 'seen':
            response = await playBack.getSeen(userId);
            break;

        case 'added':
            const addedData = await media.getRecentlyAdded(12);
            response = {
                    data: addedData.map(e => {
                        const {id, name, poster, background, type} = e;
                        return {
                            id,
                            name,
                            poster,
                            background,
                            type
                        }
                    }),
                    type: 'BASIC', display: 'recently added media'
                };
            break;

        case 'library':
            const libType = req.query.value === 'movies' ? MediaType.MOVIE : MediaType.SHOW;
            const trendingData = await media.getTrending();
            response = trendingData.map(e => {
                const {id, backdrop, type, trailer, logo, name, overview} = e;
                return {id, backdrop, type, trailer, logo, name, overview}
            }).filter(e => e.logo !== null && e.type === libType).slice(0, 10) as Banner[];
            break;

        case 'lib':
            const libType2 = req.query.lib === 'movies' ? MediaType.MOVIE : MediaType.SHOW;
            response = await media.searchLibrary(libType2, +req.query.page);
            break;

        case 'genres':
            response = await media.getGenres();
            break;

        case 'genre':
            response = await media.searchGenre(req.query.genre as string, +req.query.page);
            break;

        case 'decades':
            response = await media.getDecades();
            break;

        case 'decade':
            response = await media.searchDecade(+req.query.decade, +req.query.page);
            break;

        case 'collection':
            response = await media.searchCollections(+req.query.page);
            break;

        case 'collections':
            response = await media.getCollections();
            break;

        case type.match(/^recommend/)?.input:
            response = await media.getRecommended(userId) || {};
            break;

        case type.match(/^(editor|basic)/)?.input:
            response = await listEditors.getPick(type);
            break;

        case 'genresAndDecades':
            const genresAndDecadesType = req.query.mediaType === MediaType.MOVIE ? MediaType.MOVIE : MediaType.SHOW;
            const genresAndDecadesGenre = await media.getGenres(genresAndDecadesType);
            const genresAndDecadesDecades = await media.getDecades(genresAndDecadesType);
            response = {genres: genresAndDecadesGenre, decades: genresAndDecadesDecades};
            break;
        default:
            response = 'error: no type';
            break;
    }

    res.status(200).json(response);
};
