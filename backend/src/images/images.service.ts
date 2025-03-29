import { TaskEither, sortBy, createNotFoundError, normalise, dedupeBy } from '@eleven-am/fp';
import { AppendedImages, LibraryType, Media } from '@eleven-am/tmdbapi';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MediaType } from '@prisma/client';
import { getAverageColor } from 'fast-average-color-node';
import { levenshtein } from 'locutus/php/strings';
import { z } from 'zod';
import { FAN_ART_API_KEY_SYMBOL } from '../config/constants';
import { HttpService } from '../http/http.service';
import { LanguageService } from '../language/language.service';
import { FAN_ART_KEY_UPDATED_EVENT } from '../misc/misc.constants';

import {
    AppleImageItem,
    AppleImagesSchema,
    AppleOptions,
    FanArtBulkImages,
    FanArtBulkImagesSchema,
    FrontImage,
    FrontImages,
    Image,
    ScannedImages,
    FanArtKeyEvent,
} from './images.contracts';


@Injectable()
export class ImagesService {
    private readonly fanArtBaseUrl = 'https://webservice.fanart.tv/v3';

    constructor (
        private readonly httpService: HttpService,
        private readonly languageService: LanguageService,
        @Inject(FAN_ART_API_KEY_SYMBOL) private fanArtApiKey: string,
    ) {}

    /**
     * Get the front images for a media item
     * @param media The media item to get the front images for
     * @param type The type of media item
     */
    public getFrontImages (media: Media<LibraryType, { external_ids: true, images: true }>, type: LibraryType) {
        const name = 'title' in media ? media.title : media.name;
        const year = 'release_date' in media ? new Date(media.release_date).getFullYear() : new Date(media.first_air_date).getFullYear();
        const fanArtId = type === MediaType.MOVIE ? media.id : media.external_ids.tvdb_id!;
        const appleImages = this.getAppleImages(type, name, year);
        const fanArtImages = this.getFanArtImages(type, fanArtId, name, year);
        const tmDBImages = TaskEither.of(this.convertTmDBImages(media.images, name, year, media.original_language));

        return TaskEither
            .of([appleImages, fanArtImages, tmDBImages])
            .chainArray((items) => items)
            .map((images) => images.reduce(
                (acc, curr) => this.concatFrontImages(acc, curr),
                this.identityFrontImages(),
            ))
            .chain((images) => this.getScannedImages(images, name, year)
                .orNull()
                .map((scannedImages) => ({
                    scannedImages,
                    frontImages: images,
                })));
    }

    /**
   * Get the average color from an image
   * @param url The URL of the image to get the average color from
   */
    public getAverageColorFromUrl (url: string | null) {
        return TaskEither
            .fromNullable(url)
            .chain((url) => TaskEither
                .tryCatch(
                    () => getAverageColor(url),
                    'Failed to get average color from image',
                ))
            .map((color) => `${color.value.slice(0, 3).join(',')},`);
    }

    /**
     * Update the FanArt API key
     * @param event The event containing the new FanArt API key
     */
    @OnEvent(FAN_ART_KEY_UPDATED_EVENT)
    public onFanArtApiKeyChange (event: FanArtKeyEvent) {
        this.fanArtApiKey = event.fanArtKey;
    }

    private convertTmDBImages (images: AppendedImages, name: string, year: number, originalLanguage: string) {
        const languageCode = this.languageService.defaultLanguage.languageCode;
        const fetchData = (languageCode: string, positive = true) => {
            const mappedPosters: FrontImage[] = [...images.backdrops, ...images.posters]
                .filter((image) => image.file_path !== null)
                .filter((image) => image.iso_639_1 === null || image.iso_639_1 === languageCode)
                .map((image) => {
                    let likes = 500;

                    const aspectRatioLikes = image.aspect_ratio > 1.5 ? 500 : -300;
                    const languageLikes = image.iso_639_1 === languageCode ? 500 : -200;

                    likes += Math.floor((image.vote_count * image.vote_average) + (aspectRatioLikes + languageLikes));

                    return {
                        year: year || 0,
                        language: image.iso_639_1,
                        source: 'TmDB',
                        likes,
                        drift: 0,
                        name,
                        url: `https://image.tmdb.org/t/p/original${image.file_path}`,
                    };
                });

            const mappedBackdrops: FrontImage[] = images.backdrops
                .filter((image) => image.file_path !== null)
                .filter((image) => image.iso_639_1 === null || image.iso_639_1 === languageCode)
                .map((image) => {
                    let likes = 0;

                    const likesOnAspectRatio = image.aspect_ratio > 1.5 ? 500 : -300;
                    const likesOnLanguage = image.iso_639_1 === languageCode ? -500 : 200;

                    likes += Math.floor((likesOnAspectRatio + likesOnLanguage) + (image.vote_count * image.vote_average));
                    likes += (100 * (positive ? 1 : -1));

                    return {
                        year: year || 0,
                        language: image.iso_639_1,
                        source: 'TmDB',
                        likes,
                        drift: 0,
                        name,
                        url: `https://image.tmdb.org/t/p/original${image.file_path}`,
                    };
                });

            const mappedLogos: FrontImage[] = images.logos
                .filter((image) => image.file_path !== null)
                .filter((image) => image.iso_639_1 === null || image.iso_639_1 === languageCode)
                .map((image) => {
                    let likes = Math.floor(image.vote_count * image.vote_average);

                    likes += image.iso_639_1 === languageCode
                        ? 1000 :
                        image.iso_639_1 === null ? -1000 : 0;

                    likes += (100 * (positive ? 1 : -1));

                    return {
                        year: year || 0,
                        language: image.iso_639_1,
                        source: 'TmDB',
                        likes,
                        drift: 0,
                        name,
                        url: `https://image.tmdb.org/t/p/original${image.file_path}`,
                    };
                });

            const mappedPortraits: FrontImage[] = images.posters
                .filter((image) => image.file_path !== null)
                .filter((image) => image.iso_639_1 === null || image.iso_639_1 === languageCode)
                .map((image) => {
                    let likes = 0;

                    const likesOnAspectRatio = image.aspect_ratio < 1.5 ? 500 : -300;
                    const likesOnLanguage = image.iso_639_1 === languageCode ? 500 : -100;

                    likes += Math.floor((likesOnAspectRatio + likesOnLanguage) + (image.vote_count * image.vote_average));
                    likes += (100 * (positive ? 1 : -1.5));

                    return {
                        year: year || 0,
                        language: image.iso_639_1,
                        source: 'TmDB',
                        likes,
                        drift: 0,
                        name,
                        url: `https://image.tmdb.org/t/p/original${image.file_path}`,
                    };
                });

            const response: FrontImages = {
                logos: mappedLogos,
                backdrops: mappedBackdrops,
                posters: mappedPosters,
                portraits: mappedPortraits,
            };

            return response;
        };

        const defaultImages = fetchData(languageCode);
        const originalLanguageImages = fetchData(originalLanguage, false);

        const response: FrontImages = {
            logos: dedupeBy([...defaultImages.logos, ...originalLanguageImages.logos], 'url'),
            backdrops: dedupeBy([...defaultImages.backdrops, ...originalLanguageImages.backdrops], 'url'),
            posters: dedupeBy([...defaultImages.posters, ...originalLanguageImages.posters], 'url'),
            portraits: dedupeBy([...defaultImages.portraits, ...originalLanguageImages.portraits], 'url'),
        };

        return response;
    }

    private getScannedImages (images: FrontImages, name: string, year: number) {
        const posters = sortBy(normalise(images.posters, 'likes'), ['drift', 'likes', 'source'], ['asc', 'desc', 'asc'])
            .filter((item) => year - 1 <= item.year && item.year <= year + 1 && item.drift < 2);

        const backdrops = sortBy(normalise(images.backdrops, 'likes'), ['drift', 'likes', 'source'], ['asc', 'desc', 'asc'])
            .filter((item) => year - 1 <= item.year && item.year <= year + 1 && item.drift < 2);

        const logos = sortBy(normalise(images.logos, 'likes'), ['drift', 'likes', 'source'], ['asc', 'desc', 'asc'])
            .filter((item) => year - 1 <= item.year && item.year <= year + 1 && item.drift < 2);

        const portraits = sortBy(normalise(images.portraits, 'likes'), ['drift', 'likes', 'source'], ['asc', 'desc', 'asc'])
            .filter((item) => year - 1 <= item.year && item.year <= year + 1 && item.drift < 2);

        return TaskEither
            .of({
                posters,
                backdrops,
                logos,
                portraits,
            })
            .filter(
                ({ posters, backdrops, portraits }) => Boolean(posters.length && backdrops.length && portraits.length),
                () => createNotFoundError(`No matching images found for media ${name}`),
            )
            .map(({ backdrops, posters, logos, portraits }) => ({
                backdrop: backdrops[0],
                poster: posters[0],
                logo: logos[0],
                portrait: portraits[0],
            }))
            .chain((images) => TaskEither
                .fromBind({
                    backdropAvgColor: this.getAverageColorFromUrl(images.backdrop.url),
                    posterAvgColor: this.getAverageColorFromUrl(images.poster.url),
                    logoAvgColor: this.getAverageColorFromUrl(images.logo?.url || '').orNull(),
                    portraitAvgColor: this.getAverageColorFromUrl(images.portrait.url),
                })
                .map((colors): ScannedImages => ({
                    ...colors,
                    backdrop: images.backdrop.url,
                    poster: images.poster.url,
                    logo: images.logo?.url || null,
                    portrait: images.portrait.url,
                })));
    }

    private getFanArtImages (type: LibraryType, id: number, name: string, year: number) {
        const params = {
            api_key: this.fanArtApiKey,
        };

        return this.httpService
            .getSafe(
                `${this.fanArtBaseUrl}/${this.getFanArtEndpoint(type)}/${id}`,
                FanArtBulkImagesSchema,
                { params },
            )
            .map((data) => this.convertImages(data, name, year))
            .orElse(() => TaskEither.of(this.identityFrontImages()));
    }

    private getAppleImages (mediaType: LibraryType, mediaName: string, year: number) {
        const language = this.languageService.defaultLanguage;
        const options = language.storeFronts.map((storeFront): AppleOptions => ({
            countryCode: storeFront.countryCode,
            storeFront,
            year,
        }));

        return TaskEither
            .of(options)
            .chainItems((option) => this.getAppleImagesForStorefront(mediaType, mediaName, option))
            .map((images): FrontImages => images.reduce(
                (acc, curr) => this.concatFrontImages(acc, curr),
                this.identityFrontImages(),
            ));
    }

    private getAppleImagesForStorefront (mediaType: LibraryType, mediaName: string, options: AppleOptions) {
        return this.getImagesFromBenDodson(mediaType, mediaName, options)
            .map((data) => data
                .filter((item) => item.type === (mediaType === MediaType.MOVIE ? 'Movie' : 'Show'))
                .filter((item) => levenshtein(item.title, mediaName) < 3 || new Date(item.releaseDate || 0).getFullYear() === options.year))
            .filter(
                (filteredData) => Boolean(filteredData.length),
                () => createNotFoundError(`No Apple images found for ${mediaName}`),
            )
            . map((filteredData): FrontImages => {
                const posters: FrontImage[] = [];
                const backdrops: FrontImage[] = [];
                const logos: FrontImage[] = [];
                const portraits: FrontImage[] = [];

                filteredData.forEach((item) => {
                    const drift = levenshtein(item.title, mediaName);
                    const language = options?.storeFront?.languageCode || 'en';
                    const realYear = item.releaseDate ? new Date(item.releaseDate).getFullYear() : 0;
                    const year = realYear === 0 ? options.year : realYear;
                    const likes = Math.ceil(2000 / (drift === 0 || realYear === options.year ? 1 : drift)) + (year === options?.year ? 1000 : -3000);
                    const source = 'APPLE' as const;
                    const data = {
                        year,
                        drift,
                        likes,
                        language,
                        source,
                    };

                    const poster = item.images.coverArt16X9 || null;
                    const logo = item.images.fullColorContentLogo ? item.images.fullColorContentLogo : item.images.singleColorContentLogo || null;
                    const background = item.images.previewFrame || null;
                    const portrait = item.images.coverArt || null;

                    if (poster) {
                        posters.push({
                            ...data,
                            name: item.title!,
                            url: this.interpretImage(poster, 'jpg', 1280),
                        });
                    }

                    if (background) {
                        backdrops.push({
                            ...data,
                            name: item.title!,
                            url: this.interpretImage(background, 'jpg'),
                        });
                    }

                    if (logo) {
                        logos.push({
                            ...data,
                            name: item.title!,
                            url: this.interpretImage(logo, 'png'),
                        });
                    }

                    if (portrait && portrait.width < portrait.height) {
                        portraits.push({
                            ...data,
                            name: item.title!,
                            url: this.interpretImage(portrait, 'jpg'),
                        });
                    }
                });

                return {
                    posters,
                    backdrops,
                    logos,
                    portraits,
                };
            });
    }

    private interpretImage (image: Image, format: string, newWidth?: number) {
        const ratio = image.width / image.height;
        const newHeight = newWidth ? Math.floor(newWidth / ratio) : image.height;

        return image.url.replace('{w}', String(newWidth || image.width))
            .replace('{h}', String(newHeight))
            .replace('{f}', format);
    }

    private getImagesFromBenDodson (mediaType: LibraryType, mediaName: string, options: AppleOptions) {
        const storeFront = options.storeFront;
        const body = {
            locale: `${storeFront.languageCode}-${storeFront.countryCode}`,
            query: mediaName,
            storeFront: storeFront.storeFrontId,
        };

        return this.httpService
            .postSafe(
                'https://itunesartwork.bendodson.com/url.php',
                z.object({ url: z.string() }),
                body,
            )
            .map(({ url }) => new URL(url))
            .chain((url) => {
                const searchParams = new URLSearchParams(url.search);

                const params = {
                    ...Object.fromEntries(searchParams.entries()),
                    sf: storeFront.storeFrontId,
                    l: storeFront.languageCode,
                    c: storeFront.countryCode,
                    q: mediaName,
                };

                return this.httpService
                    .getSafe(
                        url.origin + url.pathname,
                        AppleImagesSchema,
                        { params },
                    );
            })
            .filter(
                (newData) => Boolean(newData.data?.canvas?.shelves.length),
                () => createNotFoundError(`No Apple images found for ${mediaName}`),
            )
            .map((newData): AppleImageItem[] => {
                const movies = newData.data!.canvas.shelves.find((shelf) => shelf.title === 'Movies');
                const tvShows = newData.data!.canvas.shelves.find((shelf) => shelf.title === 'TV Shows');

                return (mediaType === MediaType.MOVIE ? movies?.items : tvShows?.items) || [];
            })
            .filter(
                (shelf) => Boolean(shelf && shelf.length),
                () => createNotFoundError(`No Apple images found for ${mediaName}`),
            );
    }

    private getFanArtEndpoint (type: LibraryType) {
        switch (type) {
            case 'MOVIE':
                return 'movies';
            case 'SHOW':
                return 'tv';
            default:
                throw new Error(`Invalid type ${type}`);
        }
    }

    private convertImages (images: FanArtBulkImages, name: string, year: number): FrontImages {
        const language = this.languageService.defaultLanguage.languageCode;
        const logos = images.hdmovielogo || images.hdtvlogo || [];
        const clearArts = images.hdmovieclearart || images.hdclearart || [];
        const posters = images.movieposter || images.tvposter || [];
        const backgrounds = images.moviebackground || images.showbackground || [];
        const thumbs = images.moviethumb || images.tvthumb || [];

        const resultLogos: FrontImage[] = logos
            .filter((img) => img.lang === language || img.lang === null)
            .map((logo) => ({
                language: logo.lang,
                likes: Number(logo.likes),
                source: 'X-ART',
                url: logo.url,
                drift: 0,
                name,
                year,
            }));

        const resultBackdrops: FrontImage[] = backgrounds
            .filter((img) => img.lang === language || img.lang === null)
            .map((backdrop) => ({
                language: backdrop.lang,
                likes: Number(backdrop.likes),
                source: 'X-ART',
                url: backdrop.url,
                drift: 0,
                name,
                year,
            }));

        const resultPosters: FrontImage[] = posters
            .filter((img) => img.lang === language || img.lang === null)
            .map((poster) => ({
                language: poster.lang,
                likes: Number(poster.likes),
                source: 'X-ART',
                url: poster.url,
                drift: 0,
                name,
                year,
            }));

        const resultThumbs: FrontImage[] = thumbs
            .filter((img) => img.lang === language || img.lang === null)
            .map((thumb) => ({
                language: thumb.lang,
                likes: Number(thumb.likes),
                source: 'X-ART',
                url: thumb.url,
                drift: 0,
                name,
                year,
            }));

        const resultClearArts: FrontImage[] = clearArts
            .filter((img) => img.lang === language || img.lang === null)
            .map((clearArt) => ({
                language: clearArt.lang,
                likes: Number(clearArt.likes),
                source: 'X-ART',
                url: clearArt.url,
                drift: 0,
                name,
                year,
            }));

        return {
            logos: resultLogos,
            backdrops: resultBackdrops,
            posters: [...resultPosters, ...resultThumbs, ...resultClearArts],
            portraits: resultPosters,
        };
    }

    private identityFrontImages () {
        return {
            logos: [],
            backdrops: [],
            posters: [],
            portraits: [],
        };
    }

    private concatFrontImages (images: FrontImages, newImages: FrontImages): FrontImages {
        return {
            logos: [...images.logos, ...newImages.logos],
            backdrops: [...images.backdrops, ...newImages.backdrops],
            posters: [...images.posters, ...newImages.posters],
            portraits: [...images.portraits, ...newImages.portraits],
        };
    }
}
