import type {NextApiRequest, NextApiResponse} from 'next';
import Playback from "../../../../server/classes/playback";
import Springboard from "../../../../server/classes/springboard";
import {ListEditors} from "../../../../server/classes/listEditors";
import {MediaType} from '@prisma/client';
import {confirmContext} from "../auth";

const playback = new Playback();
const spring = new Springboard();
const list = new ListEditors();

export default async (req: NextApiRequest, res: NextApiResponse) => {
    let {userId} = confirmContext(req.cookies);

    if (req.method === 'POST'){
        res.status(400).json('Invalid request method');
        return;
    }

    let body = {...req.body, ...req.query};
    let response: any = {};

    if (body.type === 'added')
        response = await spring.getRecent();

    else if (body.type === 'banner')
        response = await spring.bannerTrending();

    else if (body.type === 'continue') {
        response = await playback.getContinue(userId);
        playback.loadSuggestion(userId);
    }

    else if (body.type === 'myList')
        response = await list.getMyList(userId)

    else if (body.type === 'seen')
        response = await playback.getSeen(userId);

    else if (body.type === "segment")
        response.data = await list.getSegments();

    else if (body.type === "suggestion")
        response = await playback.getSuggestions(userId);

    else if (body.type === "trending")
        response = await spring.getTrending();

    else if (body.type === 'authImages')
        response = await spring.authImages(true);

    else if (body.type === 'genre') {
        const genre = !Array.isArray(body.genre)? body.genre: body.genre[0];
        response = await spring.getGenre(genre, +(body.page))
    }

    else if (body.type === 'decade') {
        const decade = !Array.isArray(body.decade)? body.decade: body.decade[0];
        response = await spring.getDecade(+decade, +(body.page))
    }

    else if (body.type === 'lib') {
        const library = body.lib === 'movies' ? MediaType.MOVIE: MediaType.SHOW;
        response = await spring.library(+(body.page), library);
    }

    else if (body.type === 'library') {
        let type = body.value === 'movies' ? MediaType.MOVIE: MediaType.SHOW;
        response = await spring.libraryTrending(type);
    }

    else if (body.type === 'search') {
        let type = body.node !== 'list';
        let searchValue = Array.isArray(body.value)? body.value[0]: body.value;
        response = await spring.search(searchValue, type);
    }

    else if (body.type === 'grid')
        response = body.value === 'genres' ? await spring.getGenres() : await spring.getDecades();

    else
        response = await list.getCategory(body.type);

    res.status(200).json(response);
}
