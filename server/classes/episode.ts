import {getDetails, getEpisode, getSeasonInfo, tmdbEpisode} from "../base/tmdb_hook";
import {prisma, magnet} from '../base/utils';
import {drive_v3} from "googleapis";
import {MediaType} from '@prisma/client';

/**
 * {seasonId, episode?, overview?, name, backdrop, id}
 */
export interface EpisodeInterface {
    overview?: string;
    position?: number;
    name: string;
    /**
     * Could be poster if the info is season and not episode
     */
    backdrop: string;
    id: number;
}

export interface DetailedEpisode extends EpisodeInterface {
    overview: string;
    episode?: number;
    seasonId?: number;
    logo: string;
    type: MediaType;
    playlistId?: number;
}

export default class Episode {
    /**
     * @desc @desc returns the valid response for a media section
     * @param showId
     * @param userId
     */
    async getSections(showId: number, userId: string): Promise<{ data: EpisodeInterface[]; section: string[] } | null> {
        let data = await prisma.episode.findMany({
            where: {showId},
            distinct: ["seasonId"],
        });
        if (data.length === 1 && data[0].seasonId === 1) {
            let section = ["Episodes"];
            let data = await this.getEpisodes(showId, 1, userId);

            return {data, section};
        } else if (data.length) {
            let seasons = await prisma.episode.findMany({
                where: {showId},
                select: {media: true, seasonId: true},
                distinct: ["seasonId"],
            });
            seasons = seasons.sortKey('seasonId', true);
            let section = ["Seasons"];
            let data = [];
            for (let item of seasons)
                data.push({
                    name: "Season " + item.seasonId,
                    backdrop: item.media.poster,
                    id: item.seasonId,
                });

            return {data, section};
        } else return null;
    }

    /**
     * @desc gets the episode details for a specific season of a series
     * @param showId
     * @param seasonId
     * @param userId
     */
    async getEpisodes(showId: number, seasonId: number, userId: string): Promise<EpisodeInterface[]> {
        let data: EpisodeInterface[] = [];
        let episodes = await prisma.episode.findMany({
            where: {showId, seasonId},
            select: {media: true, id: true, episode: true, seasonId: true},
        });
        let result = await prisma.view.findMany({
            where: {
                userId,
                episode: {showId},
                position: {gt: 0}
            }, select: {position: true, episode: true, updated: true}
        })

        result = result.sortKey('updated', false);
        episodes = episodes.sortKeys('seasonId', 'episode', true, true);
        let response = await getSeasonInfo({
            tmdbId: episodes[0].media.tmdbId,
            seasonId: episodes[0].seasonId,
        });
        if (response){
            let season = response.episodes;
            for (let item of episodes) {
                let episode = season.find(e => e.episode_number === item.episode);
                let view = result.find(e => e.episode && e.episode.episode === item.episode && e.episode.seasonId === seasonId);
                let position = view ? view.position > 919 ? 100 : view.position / 10 : 0;
                let overview = episode && episode.overview && episode.overview !== "" ? episode.overview : item.media.overview;
                let name = item.episode + '. ' + (episode && episode.name ? episode.name : "Episode " + item.episode);
                let backdrop = episode && episode.still_path ? "https://image.tmdb.org/t/p/original" + episode.still_path : item.media.backdrop;
                data.push({position, overview, name, backdrop, id: item.id});
            }
        }
        return data;
    }

    /**
     * @desc gets an episode for display purposes
     * @param episodeId
     */
    async getEpisode(episodeId: number): Promise<DetailedEpisode | null> {
        let episode = await prisma.episode.findUnique({
            where: {id: episodeId},
            include: {media: true},
        });
        if (episode) {
            let obj = {
                tmdbId: episode.media.tmdbId,
                episode: episode.episode,
                seasonId: episode.seasonId,
            };
            let episodeInfo = await getEpisode(obj);
            let logo = episode.media.logo;
            let overview = episodeInfo.overview && episodeInfo.overview !== "" ? episodeInfo.overview : episode.media.overview;
            let name = episodeInfo.name ? episodeInfo.name : "Episode " + episode.episode;
            let backdrop = episodeInfo.still_path ? "https://image.tmdb.org/t/p/original" + episodeInfo.still_path : episode.media.backdrop;
            return {type: MediaType.SHOW, overview, name, logo, backdrop, id: episode.videoId, episode: obj.episode, seasonId: obj.seasonId};
        }

        return null;
    }

    /**
     * @desc returns the video for playback following a season episode order
     * @param videoId
     */
    async upNext(videoId: number): Promise<DetailedEpisode | null> {
        let video = await prisma.video.findUnique({
            where: {id: videoId},
            include: {episode: true},
        });
        if (video && video.episode) {
            let episodes = await prisma.episode.findMany({
                orderBy: [{seasonId: "asc"}, {episode: "asc"}],
                where: {showId: video.episode.showId},
            });
            let index = episodes.findIndex(item => item.videoId === videoId);
            let episode = index > -1 && index < episodes.length - 1 ? episodes[index + 1] : null;
            if (episode) {
                let info = await this.getEpisode(episode.id);
                if (info)
                    return {...info, id: episode.id};
            }
        }

        return null;
    }

    /**
     * @desc adds an entry into the episodes table
     * @param showId
     * @param file
     * @param episode_number
     * @param seasonId
     */
    async addEpisode (showId: number, file: drive_v3.Schema$File, episode_number: number, seasonId: number) {
        let data = {
            english: null,
            location: file.id!,
            french: null, german: null,
            mediaId: showId
        }

        let video = await prisma.video.upsert({
            create: {...data},
            update: {...data},
            where: {location: file.id!}
        })

        const episode = {
            episode: episode_number, seasonId,
            showId, videoId: video.id,
        }

        await prisma.episode.upsert({
            create: {...episode},
            update: {...episode},
            where: {episodeId: {showId, episode: episode_number, seasonId}}
        })

        await prisma.sub.upsert({
            where: {videoId: video.id},
            create: {videoId: video.id},
            update: {videoId: video.id}
        })
    }

    /**
     * @desc scans a show and attempts to download the new || missing episodes || seasons
     * @param showId
     */
    async getNewEpisodes(showId: number) {
        let media = await prisma.media.findFirst({where: {id: showId}, include: {episodes: true}});
        if (media) {
            const episodes = media.episodes.sortKeys('season', 'episode', true, true);
            const seasons = episodes.uniqueID('seasonId');
            const show = await getDetails(MediaType.SHOW, media.tmdbId);
            if (show) {
                if (show.number_of_seasons > seasons.length || show.number_of_episodes > episodes.length) {
                    if (show.number_of_seasons > seasons.length) {
                        const promises: Promise<boolean>[] = [];
                        const season = [...Array(show.number_of_seasons).keys()].map(e => {return {seasonId: e}});
                        const missingSeason = seasons.filterInFilter<{seasonId: number}>(season, 'seasonId', 'seasonId');
                        missingSeason.forEach(e => {
                             promises.push(magnet.findSeason(media!.tmdbId, e.seasonId))
                        })

                        await Promise.all(promises);
                    } else
                        for (let i = 1; i <= show.number_of_seasons; i++) {
                            let seasonEpisodes = episodes.filter(e => e.seasonId === i);
                            const response = await getSeasonInfo({tmdbId: media.tmdbId, seasonId: i});
                            if (response && seasonEpisodes.length < response.episodes.length) {
                                let missing = seasonEpisodes.filterInFilter<tmdbEpisode>(response.episodes, 'episode', 'episode_number');
                                let missingEpisodes = missing.filter(e => {
                                    const now = new Date().getTime();
                                    const date = new Date(e.air_date).getTime();
                                    return date < now;
                                })

                                for (let item of missingEpisodes)
                                    await magnet.findSeason(media.tmdbId, i, item.episode_number);
                            }
                        }
                }
            }
        }
    }
}