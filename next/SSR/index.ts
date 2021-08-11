import {MediaType} from '@prisma/client'
import Springboard from "../../server/classes/springboard";
import User from "../../server/classes/auth";
import FramesCast from "../../server/classes/framesCast";
const spring = new Springboard();
const user = new User();
const frames = new FramesCast();

export const banner = async () => await spring.bannerTrending();
export const segment = async () => await spring.getSegment();

export const getAuthImages = async () => await spring.authImages();
export const getGuest = async () => await user.getGuest();
export const createGuest = async (auth: string) => await user.createGuestUser(auth);
export const confirmUser = async (auth: string) => await user.confirmUserId(auth);

export const findMedia = async (request: string, type: MediaType) => await spring.findMedia(request, type);
export const getInfo = async (userId: string, mediaId: number) => await spring.getInfo(mediaId, userId, false);

export const metaTags = async (type: string, value: string) => await spring.metaTags(type, value);
export const shuffleMedia = async (media_id: number, user_id: string) => await spring.shuffleMedia(media_id, user_id);
export const playFromPlaylist = async (play: number, userId: string) => await spring.playFromPlaylist(play, userId);
export const playMedia = async (media_id: number, user_id: string, episode?: boolean) => await spring.playMedia(media_id, user_id, episode || false);
export const findAuth = async (auth: string, user_id: string) => await spring.findByAuth(auth, user_id);
export const findFrame = async (frame: string, user_id: string) => await frames.decryptCipher(frame, user_id);

export const getProd = async (companyId: string) => await spring.getCompanyDetails(companyId);
export const findProd = async (name: string) => await spring.findCompanyByName(name);

export const convertUrl = (mediaId: string) => {
    mediaId = mediaId.replace(/\+/g, ' ').replace(/\?.*clid[^"]+/, "");
    mediaId = mediaId.replace(/\s{3}/, ' + ');
    mediaId = mediaId.replace(/\s$/, '+');
    return mediaId;
}