import AuthService, {Base} from "./auth";
import MediaClass from "./media";
import {Episode, Media as Med, MediaType, Role, UseCase, Video} from "@prisma/client";

export interface WatchHistory {
    overview: string;
    backdrop: string;
    name: string;
    watchedId: number;
    timeStamp: string;
    position: number;
    location: string;
}

export interface FrameMediaLite {
    id: number,
    poster: string,
    name: string,
    type: MediaType,
    background: string,
    logo: string | null,
    overview: string,
    backdrop: string,
    location: string,
}

export interface SpringLoad {
    videoId: number;
    mediaId: number;
    episodeId: number | null;
    overview: string;
    logo: string | null;
    backdrop: string;
    name: string;
    poster: string;
    playlistId: number | null;
    episodeName: string | null;
    location: string;
    inform: boolean;
    autoplay: boolean;
    position: number;
    guest: boolean;
    playerId: string;
    cdn: string;
    activeSub: string;
    frame: boolean;
    subs: { language: string, url: string, label: string, lang: string }[],
}

export interface SpringPlay extends SpringLoad {
    position: number;
}

export interface Sub {
    id: number;
    start: number;
    end: number;
    text: string;
    diff: number;
    style: { fontStyle: string, fontWeight: string, textDecoration: string }
}

export default class Playback extends Base {
    protected readonly mediaClass: MediaClass;

    constructor() {
        super();
        this.mediaClass = new MediaClass();
    }

    /**
     * @desc gets the videom information for the worker to load
     * @param auth
     */
    public async getWorkerInfo(auth: string) {
        const view = await this.prisma.view.findFirst({
            where: {auth},
            include: {video: {include: {media: true, episode: true}}}
        });

        const download = await this.prisma.download.findFirst({
            where: {location: auth},
            include: {view: {include: {video: {include: {media: true, episode: true}}}}}
        });

        if (view)
            return {location: view.video.location, download: false, name: ''};

        else if (download && (download.created.getTime() + (1000 * 60 * 60 * 2)) > Date.now()) {
            let name = download.view.video.media.name;
            if (download.view.video.episode) {
                const temp = await this.mediaClass.getEpisode(download.view.video.episode.id);
                name = temp?.name ?? name;
            }

            return {location: download.view.video.location, download: true, name};
        }

        return {location: '', download: false, name: ''};
    }

    /**
     * @desc Get the details of a media
     * @param id - The id of the media
     * @param userId - The id of the user
     * @param save - Whether to create a group watch link for this media
     */
    public async getMediaLite(id: number, userId: string, save: boolean): Promise<FrameMediaLite | null> {
        if (isNaN(id)) return null;

        const data = await this.prisma.media.findUnique({
            where: {id},
            include: {videos: true, episodes: {include: {video: true}, orderBy: [{seasonId: 'asc'}, {episode: 'asc'}]}}
        });

        if (data) {
            if (save) {
                const videoId = data.episodes && data.episodes.length > 0 ? data.episodes[0].videoId : data.videos.length ? data.videos[0].id : null;
                if (videoId) {
                    const playObject = await this.setPlayBack(videoId, userId, false, null);
                    if (playObject)
                        return {
                            id: data.id,
                            name: data.name,
                            logo: data.logo,
                            backdrop: data.backdrop,
                            overview: data.overview,
                            poster: data.poster,
                            type: data.type,
                            background: data.background,
                            location: playObject.location,
                        }
                }
            } else
                return {
                    id: data.id,
                    name: data.name,
                    type: data.type,
                    poster: data.poster,
                    backdrop: data.backdrop,
                    logo: data.logo,
                    background: data.background,
                    overview: data.overview,
                    location: ''
                };
        }

        return null;
    }

    /**
     * @desc adds a file to the download queue if the auth token is valid and the auth file exists
     * @param auth - the auth location of the file
     * @param authKey - the auth token to be validated
     * @param userId - the user's identifier
     */
    public async addFileToDownload(auth: string, authKey: string, userId: string): Promise<string | null> {
        const authService = new AuthService();
        const file = await this.prisma.view.findFirst({where: {auth}, select: {video: true}});
        const userFile = await this.prisma.user.findUnique({where: {userId}});
        const valid = await authService.validateAuthKey(authKey, userFile?.role || Role.USER);
        if (valid === 0 && file && userFile) {
            await authService.utiliseAuthKey(authKey, userId, UseCase.DOWNLOAD, auth);
            const location = this.createUUID();
            await this.prisma.download.create({
                data: {
                    location, auth, userId
                }
            });
            return location;
        }

        return null;
    }

    /**
     * @desc gets the SRT|VTT and converts them to frames Subtitles
     * @param auth - the auth string
     * @param language - the language of the subtitles
     * @param pure - whether to return the pure subtitles or the frames
     */
    public async getSub(auth: string, language: string, pure?: boolean): Promise<Sub[] | string | null> {
        const file: { video: { [key: string]: any } } | null = await this.prisma.view.findFirst({
            where: {auth},
            select: {video: true}
        });
        if (file && file.video && file.video.hasOwnProperty(language.toLowerCase()) && file.video[language.toLowerCase()] !== null && file.video[language.toLowerCase()] !== '') {
            const sub = file.video[language.toLowerCase()];
            let res: string | null = null;
            try {
                res = await this.fetch(sub).then(res => res.text());
            } catch (e) {
                return null;
            }

            if (res) {
                if (pure) {
                    let result = '';
                    let index = 0;
                    const srt = res.replace(/^\s+|\s+$|\r+/g, '');
                    const cueList = srt.split('\n\n');
                    if (cueList.length > 0) {
                        result += "WEBVTT\n\n";
                        while (index < cueList.length) {
                            const caption = cueList[index];
                            let cue = "";
                            const s = caption.split(/\n/);
                            while (s.length > 3) {
                                for (let i = 3; i < s.length; i++) {
                                    s[2] += "\n" + s[i]
                                }
                                s.splice(3, s.length - 3);
                            }

                            let line = 0;
                            if (!s[0]?.match(/\d+:\d+:\d+/) && s[1]?.match(/\d+:\d+:\d+/)) {
                                cue += s[0].match(/\w+/) + "\n";
                                line++;
                            }

                            if (s[line].match(/\d+:\d+:\d+/)) {
                                const m = s[1].match(/(\d+):(\d+):(\d+)(?:,(\d+))?\s*--?>\s*(\d+):(\d+):(\d+)(?:,(\d+))?/);
                                if (m) {
                                    cue += m[1] + ":" + m[2] + ":" + m[3] + "." + m[4] + " --> "
                                        + m[5] + ":" + m[6] + ":" + m[7] + "." + m[8] + "\n";
                                    line += 1;

                                } else return "";
                            } else return "";
                            if (s[line])
                                cue += s[line] + "\n\n";

                            result += cue;
                            index++;
                        }
                    }

                    return result;

                } else {
                    res = res.replace(/\r\n|\r|\n/g, '\n');
                    const subtitle: Sub[] = [];
                    const sections = res.split('\n\n');
                    for (let item of sections) {
                        let section = item.split('\n');
                        if (section.length > 2) {
                            const id = +(section[0]);
                            const range = section[1].split(' --> ');
                            if (range.length > 1) {
                                const start = this.parseTime(range[0]);
                                const end = this.parseTime(range[1]);
                                const diff = end - start;
                                let text = section.slice(2).join(' ');
                                if (/<font/i.test(text))
                                    continue;

                                const italic = !!text.match(/\b(?:[iI]\b|\b[iI]\b)/g);
                                const bold = !!text.match(/\b(?:[bB]\b|\b[bB]\b)/g);
                                const underline = !!text.match(/\b(?:[uU]\b|\b[uU]\b)/g);
                                text = text.replace(/<\/\w+>|<\w+>/g, '');
                                const style = {
                                    fontStyle: italic ? 'italic' : 'normal',
                                    fontWeight: bold ? 'bold' : 'normal',
                                    textDecoration: underline ? 'underline' : 'none'
                                };
                                subtitle.push({id, start, end, diff, text, style});
                            }
                        }
                    }

                    return subtitle;
                }
            }
        }

        return null;
    }

    /**
     * @desc Get the current playing media information using the current auth
     * @param auth - The auth object
     * @param userId - The user identifier
     * @param inform - If the database should be informed about the current playing media
     */
    public async getPlayBack(auth: string, userId: string, inform: boolean): Promise<SpringLoad | null> {
        const videoRes = await this.prisma.view.findFirst({
            where: {auth},
            include: {episode: true, video: {include: {media: true}}}
        });

        if (videoRes) {
            const {episode, video} = videoRes;
            return await this.handlePlayBackCreation(video, userId, videoRes.playlistId, episode, inform && videoRes.inform);
        }

        return null;
    }

    /**
     * @desc Get the current playing media information using the current auth
     * @param videoId - The video identifier
     * @param userId - The user identifier
     * @param inform - Whether to inform the user
     * @param playlistId - The playlist video identifier
     */
    async setPlayBack(videoId: number, userId: string, inform: boolean, playlistId: number | null): Promise<SpringLoad | null> {
        const episode = await this.prisma.episode.findFirst({where: {videoId}});
        const video = await this.prisma.video.findFirst({where: {id: videoId}, include: {media: true}});

        if (video)
            return await this.handlePlayBackCreation(video, userId, playlistId, episode, inform);

        return null;
    }

    /**
     * @desc Handle the creation of the play back information
     * @param video - The video object
     * @param userId - The user identifier
     * @param playlistId - The playlist video identifier
     * @param episode - The episode object
     * @param inform - The inform? variable
     */
    private async handlePlayBackCreation(video: (Video & { media: Med }), userId: string, playlistId: number | null, episode: Episode | null, inform: boolean): Promise<SpringLoad | null> {
        const {media, english, french, german} = video;
        let episodeName: string | null = null;
        let location = this.createUUID();

        let {overview, backdrop, poster, logo, name} = media;
        if (episode) {
            const episodeInfo = await this.mediaClass.getEpisode(episode.id);
            if (episodeInfo) {
                overview = episodeInfo.overview || overview;
                episodeName = episodeInfo.name;
            }
        }

        let subs = [];
        if (!english && !french && !german)
            subs = await this.mediaClass.getSubtitlesForVideo({...video, episode}, location);

        else {
            if (english)
                subs.push({
                    language: 'English',
                    url: '/api/stream/subtitles?auth=' + location + '&language=english',
                    label: 'English',
                    lang: 'en'
                });

            if (french)
                subs.push({
                    language: 'French',
                    url: '/api/stream/subtitles?auth=' + location + '&language=french',
                    label: 'Français',
                    lang: 'fr'
                });

            if (german)
                subs.push({
                    language: 'German',
                    url: '/api/stream/subtitles?auth=' + location + '&language=german',
                    label: 'Deutsch',
                    lang: 'de'
                });
        }

        const user = await this.prisma.user.findUnique({where: {userId}});
        if (user) {
            const obj = {
                inform,
                playlistId,
                videoId: video.id,
                episodeId: episode?.id,
                auth: location, userId,
                created: new Date(),
                updated: new Date(),
            };

            const watched = await this.prisma.watched.findUnique({where: {seenByUser: {userId, videoId: video.id}}});

            await this.prisma.view.upsert({
                where: {auth: location},
                update: obj,
                create: obj
            });

            return {
                playlistId,
                videoId: video.id,
                mediaId: media.id,
                episodeId: episode?.id || null,
                autoplay: user.autoplay,
                inform: user.inform ? inform : false,
                playerId: this.createUUID(), frame: false,
                location, overview, activeSub: user.defaultLang,
                logo, backdrop, name, poster, cdn: this.regrouped.user?.cdn || '/api/streamVideo?auth=',
                position: inform? (watched?.position || 0) > 939 ? 0 : (watched?.position || 0): 0,
                episodeName, subs, guest: user.role === Role.GUEST
            };
        }

        return null;
    }

}
