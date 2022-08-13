import {NextApiRequest, NextApiResponse} from "next";
import Media, {gridOpt} from "../classes/media";
import User from "../classes/user";
import PickAndFrame from "../classes/pickAndFrame";
import Springboard from "../classes/springboard";

const media = new Media();
const listEditors = new PickAndFrame();
const springBoard = new Springboard();
const user = new User();

export default async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
    let response: any;
    const type = req.query.type[1];
    const body = {...req.body, ...req.query, type: req.query.type[2] || req.body.type};

    switch (type) {
        case 'search':
            const {node, value} = body;
            response = await media.search(value as string, node as gridOpt);
            break;

        case 'myList':
            const listData = await user.getMyList(userId);
            response = {
                data: listData.results.map(e => {
                    const {id, name, poster, background, type} = e;
                    return {
                        id,
                        name,
                        poster,
                        background,
                        type
                    }
                }),
                type: 'BASIC', display: 'your list'
            };
            break;

        case 'continue':
            const continueData = await user.getContinue(userId);
            response = {
                data: continueData,
                type: 'EDITOR',
                display: 'continue watching'
            }
            break;

        case 'getRelevant':
            response = await user.getRelevantMedia(userId);
            break;

        case 'trending':
            const data = await media.getTrending();
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
            response = await user.getSuggestionForHome(userId, false);
            break;

        case 'seen':
            response = await user.getSuggestionForHome(userId, true);
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

        case 'collection':
            response = await springBoard.searchCollections(+body.page);
            break;

        case 'collections':
            response = await springBoard.getCollections();
            break;

        case type.match(/^recommend/)?.input:
            response = await springBoard.getDisplayRecommended(userId) || {};
            break;

        case type.match(/^(editor|basic)/)?.input:
            response = await listEditors.getPick(type);
            break;

        default:
            response = 'error: no type';
            break;
    }

    res.status(200).json(response);
};
