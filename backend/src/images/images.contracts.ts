import { z } from 'zod';

import { StoreFront } from '../language/language.types';

export interface ScannedImages {
    backdrop: string;
    backdropAvgColor: string;
    poster: string;
    posterAvgColor: string;
    logo: string | null;
    logoAvgColor: string | null;
    portrait: string;
    portraitAvgColor: string;
}

export const FanArtImageSchema = z.object({
    id: z.string(),
    url: z.string(),
    lang: z.string(),
    likes: z.string(),
});

export const FanArtBulkImagesSchema = z.object({
    name: z.string(),
    hdmovielogo: z.array(FanArtImageSchema).optional(),
    hdtvlogo: z.array(FanArtImageSchema).optional(),
    moviethumb: z.array(FanArtImageSchema).optional(),
    tvthumb: z.array(FanArtImageSchema).optional(),
    moviebackground: z.array(FanArtImageSchema).optional(),
    showbackground: z.array(FanArtImageSchema).optional(),
    hdclearart: z.array(FanArtImageSchema).optional(),
    hdmovieclearart: z.array(FanArtImageSchema).optional(),
    movieposter: z.array(FanArtImageSchema).optional(),
    tvposter: z.array(FanArtImageSchema).optional(),
});

export const AppleImageObjectSchema = z.object({
    width: z.number(),
    height: z.number(),
    url: z.string(),
    supportsLayeredImage: z.boolean().optional(),
    joeColor: z.string().optional(),
});

const AppleImageSchema = z.object({
    coverArt: AppleImageObjectSchema.optional(),
    previewFrame: AppleImageObjectSchema.optional(),
    singleColorContentLogo: AppleImageObjectSchema.optional(),
    fullColorContentLogo: AppleImageObjectSchema.optional(),
    centeredFullScreenBackgroundImage: AppleImageObjectSchema.optional(),
    centeredFullScreenBackgroundSmallImage: AppleImageObjectSchema.optional(),
    coverArt16X9: AppleImageObjectSchema.optional(),
});

const AppleImageItemSchema = z.object({
    id: z.string().optional(),
    type: z.string().optional(),
    isEntitledToPlay: z.boolean().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    releaseDate: z.number().optional(),
    rating: z.object({
        name: z.string().optional(),
        value: z.number().optional(),
        system: z.string().optional(),
        displayName: z.string().optional(),
        reason: z.string().optional(),
    }).optional(),
    contentAdvisories: z.array(z.string()).optional(),
    tomatometerFreshness: z.string().optional(),
    tomatometerPercentage: z.number().optional(),
    commonSenseRecommendedAge: z.number().optional(),
    images: AppleImageSchema,
    url: z.string(),
    rolesSummary: z.object({
        cast: z.array(z.string()).optional(),
        directors: z.array(z.string()).optional(),
    }).optional(),
    duration: z.number().optional(),
});

export const AppleImagesSchema = z.object({
    data: z.object({
        q: z.string(),
        canvas: z.object({
            id: z.string(),
            type: z.union([z.literal('movie'), z.literal('tvShow'), z.literal('Canvas')]),
            title: z.string(),
            nextToken: z.null(),
            shelves: z.array(
                z.object({
                    title: z.string(),
                    id: z.string(),
                    items: z.array(AppleImageItemSchema),
                    url: z.string(),
                    displayType: z.string(),
                    version: z.string(),
                    nextToken: z.string().nullable(),
                }),
            ),
        }),
    }).optional(),
    utsk: z.string(),
});

export type FanArtBulkImages = z.infer<typeof FanArtBulkImagesSchema>;
export type AppleImageItem = z.infer<typeof AppleImageItemSchema>;

export interface AppleOptions {
    countryCode: string;
    year: number;
    storeFront: StoreFront;
}

export interface FrontImage {
    language: string | null;
    source: 'APPLE' | 'TmDB' | 'X-ART';
    name: string;
    year: number;
    drift: number;
    likes: number;
    url: string;
}

export interface FrontImages {
    backdrops: FrontImage[];
    posters: FrontImage[];
    logos: FrontImage[];
    portraits: FrontImage[];
}

export interface Image {
    width: number;
    height: number;
    url: string;
}

export class FanArtKeyEvent {
    constructor (public fanArtKey: string) {}
}
