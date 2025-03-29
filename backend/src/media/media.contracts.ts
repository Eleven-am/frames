import { ApiProperty } from '@nestjs/swagger';
import { CompanyType, Media, MediaType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsString, IsIn, IsArray, IsNumber } from 'class-validator';

import { PaginateArgs, HomeResponseTypes, createHomeResponse, createPageResponse } from '../utils/utils.contracts';

export enum FinMediaTypes {
    COMPANY = 'company',
    COLLECTION = 'collection',
    PERSON = 'person',
}

export interface PartialOptions {
    release_dates: true;
    videos: true;
    content_ratings: true;
}

export interface MediaPartialDetails {
    popularity: number;
    genre: string;
    trailer: string | null;
    overview: string | null;
    releaseDate: Date | null;
    rating: string;
}

export type SlimMedia = Omit<Media, 'created' | 'updated' | 'genres' | 'releaseDate'>;

export interface TmdbVideoDetails {
    imdbId: string;
    name: string;
    episodeName: string | null;
    overview: string;
    episodeOverview: string | null;
    episodeBackdrop: string | null;
}

export interface HomeResponse<T extends SlimMedia = SlimMedia> {
    results: T[];
    type: HomeResponseTypes;
    label: string;
    identifier: string;
}

export interface CastResponse {
    name: string;
    character: string;
    profilePath: string;
    tmdbId: number;
}

export type VideoType =
  | 'Bloopers'
  | 'Teaser'
  | 'Clip'
  | 'Featurette'
  | 'Behind the Scenes';

export interface CrewResponse {
    name: string;
    job: string;
    profilePath: string;
    tmdbId: number;
    department: string;
}

export interface MediaExtras {
    thumbnail: string;
    youtubeId: string;
    name: string;
    publishedAt: Date;
    type: VideoType;
}

export interface CollectionResponse {
    tmdbId: number;
    name: string;
}

export interface EpisodeResponse {
    id: string;
    name: string;
    overview: string | null;
    season: number;
    episode: number;
    photo: string;
    showId: string;
    videoId: string;
}

export enum MediaSection {
    MORE_LIKE_THIS = 'More Like This',
    EXTRAS = 'Extras',
    DETAILS = 'Details',
    MOST_RELEVANT = 'Most Relevant',
    EPISODES = 'Episodes',
    SEASONS = 'Seasons',
}

export interface SeasonResponse {
    season: number;
    episodes: EpisodeResponse[];
}

export interface CompanyResponse {
    id: string;
    name: string;
    logo: string;
    type: CompanyType;
}

export interface MediaResponse {
    id: string;
    name: string;
    poster: string;
    posterBlur: string;
    backdrop: string;
    backdropBlur: string;
    logo: string | null;
    logoBlur: string | null;
    tmdbId: number;
    type: MediaType;
    overview: string | null;
    actors: CastResponse[];
    writers: CrewResponse[];
    directors: CrewResponse[];
    producers: CrewResponse[];
    extras: MediaExtras[];
    collection: CollectionResponse | null;
    recommendations: SlimMedia[];
    companies: CompanyResponse[];
    voteAverage: number;
    releaseDate: Date | null;
    runtime: string;
    trailer: string | null;
    genre: string;
    genres: string[];
    rating: string;
    sections: MediaSection[];
    seasons: SeasonResponse[];
    mediaStatus: string | null;
}

export interface LevenshteinMatch {
    id: string;
    name: string;
    type: MediaType;
}

export interface NetworkResponse extends Omit<CompanyResponse, 'logo'> {
    movies: SlimMedia[];
    shows: SlimMedia[];
    logo: string | null;
}

export interface PersonResponse {
    id: number;
    birthday: Date;
    gender: number;
    name: string;
    biography: string;
    profile: string;
    staredIn: SlimMedia[];
    wroteFor: SlimMedia[];
    directed: SlimMedia[];
    produced: SlimMedia[];
}

export interface SearchedVideo {
    name: string;
    videoId: string;
    backdrop: string;
    backdropBlur: string;
    episode: number | null;
    season: number | null;
}

export interface SearchedMedia extends SlimMedia {
    videos: SearchedVideo[];
}

export type DetailedMedia = SlimMedia & MediaPartialDetails;

export class SlimMediaSchema {
    @ApiProperty({
        description: 'The id of the media item',
        type: String,
    })
    id: string;

    @ApiProperty({
        description: 'The name of the media item',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'The tmdb id of the media item',
        type: Number,
    })
    tmdbId: number;

    @ApiProperty({
        description: 'The poster of the media item',
        format: 'uri',
        type: String,
    })
    poster: string;

    @ApiProperty({
        description: 'The blurred poster of the media item',
        type: String,
    })
    posterBlur: string;

    @ApiProperty({
        description: 'The backdrop of the media item',
        format: 'uri',
        type: String,
    })
    backdrop: string;

    @ApiProperty({
        description: 'The blurred backdrop of the media item',
        type: String,
    })
    backdropBlur: string;

    @ApiProperty({
        description: 'The portrait of the media item',
        format: 'uri',
        type: String,
    })
    portrait: string;

    @ApiProperty({
        description: 'The blurred portrait of the media item',
        type: String,
    })
    portraitBlur: string;

    @ApiProperty({
        description: 'The logo of the media item',
        format: 'uri',
        type: String,
        nullable: true,
    })
    logo: string | null;

    @ApiProperty({
        description: 'The blurred logo of the media item',
        type: String,
        nullable: true,
    })
    logoBlur: string | null;

    @ApiProperty({
        description: 'The type of media item',
        type: String,
        'enum': [MediaType.MOVIE, MediaType.SHOW],
        enumName: 'MediaType',
    })
    type: MediaType;
}

export class DetailedMediaSchema extends SlimMediaSchema {
    @ApiProperty({
        description: 'The popularity of the media item',
        type: Number,
    })
    popularity: number;

    @ApiProperty({
        description: 'The genre of the media item',
        type: String,
    })
    genre: string;

    @ApiProperty({
        description: 'The trailer for the media item',
        type: String,
        nullable: true,
    })
    trailer: string | null;

    @ApiProperty({
        description: 'The overview of the media item',
        type: String,
        nullable: true,
    })
    overview: string | null;

    @ApiProperty({
        description: 'The release date of the media item',
        type: String,
        format: 'date-time',
        nullable: true,
    })
    releaseDate: Date | null;

    @ApiProperty({
        description: 'The rating of the media item',
        type: String,
    })
    rating: string;
}

export class LevenshteinMatchSchema {
    @ApiProperty({
        description: 'The id of the media item',
        type: String,
    })
    id: string;

    @ApiProperty({
        description: 'The name of the media item',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'The type of media item',
        type: String,
        'enum': [MediaType.MOVIE, MediaType.SHOW],
        enumName: 'MediaType',
    })
    type: MediaType;
}

class CastResponseSchema {
    @ApiProperty({
        description: 'The name of the person',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'The character the person plays',
        type: String,
    })
    character: string;

    @ApiProperty({
        description: 'The profile path of the person',
        type: String,
    })
    profilePath: string;

    @ApiProperty({
        description: 'The tmdb id of the person',
        type: Number,
    })
    tmdbId: number;
}

class CrewResponseSchema {
    @ApiProperty({
        description: 'The name of the person',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'The job the person does',
        type: String,
    })
    job: string;

    @ApiProperty({
        description: 'The profile path of the person',
        type: String,
    })
    profilePath: string;

    @ApiProperty({
        description: 'The tmdb id of the person',
        type: Number,
    })
    tmdbId: number;

    @ApiProperty({
        description: 'The department the person works in',
        type: String,
    })
    department: string;
}

class MediaExtrasSchema {
    @ApiProperty({
        description: 'The thumbnail of the extra',
        type: String,
    })
    thumbnail: string;

    @ApiProperty({
        description: 'The youtube id of the extra',
        type: String,
    })
    youtubeId: string;

    @ApiProperty({
        description: 'The name of the extra',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'The published date of the extra',
        type: String,
        format: 'date-time',
    })
    publishedAt: Date;

    @ApiProperty({
        description: 'The type of extra',
        type: String,
        'enum': ['Bloopers', 'Teaser', 'Clip', 'Featurette', 'Behind the Scenes'],
    })
    type: VideoType;
}

class CollectionResponseSchema {
    @ApiProperty({
        description: 'The tmdb id of the collection',
        type: Number,
    })
    tmdbId: number;

    @ApiProperty({
        description: 'The name of the collection',
        type: String,
    })
    name: string;
}

class EpisodeResponseSchema {
    @ApiProperty({
        description: 'The id of the episode',
        type: String,
    })
    id: string;

    @ApiProperty({
        description: 'The name of the episode',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'The overview of the episode',
        type: String,
        nullable: true,
    })
    overview: string | null;

    @ApiProperty({
        description: 'The season of the episode',
        type: Number,
    })
    season: number;

    @ApiProperty({
        description: 'The episode number',
        type: Number,
    })
    episode: number;

    @ApiProperty({
        description: 'The photo of the episode',
        type: String,
    })
    photo: string;

    @ApiProperty({
        description: 'The id of the show',
        type: String,
    })
    showId: string;

    @ApiProperty({
        description: 'The id of the video',
        type: String,
    })
    videoId: string;
}

class SeasonResponseSchema {
    @ApiProperty({
        description: 'The season number',
        type: Number,
    })
    season: number;

    @ApiProperty({
        description: 'The episodes of the season',
        type: [EpisodeResponseSchema],
    })
    episodes: EpisodeResponse[];
}

class CompanyResponseSchema {
    @ApiProperty({
        description: 'The id of the company',
        type: String,
    })
    id: string;

    @ApiProperty({
        description: 'The name of the company',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'The logo of the company',
        type: String,
        nullable: true,
    })
    logo: string | null;

    @ApiProperty({
        description: 'The type of company',
        type: String,
        'enum': [CompanyType.PRODUCTION, CompanyType.DISTRIBUTION],
        enumName: 'CompanyType',
    })
    type: CompanyType;
}

export class SearchMediaArgs extends PaginateArgs {
    @IsString()
    @ApiProperty({
        description: 'The search query',
        type: 'string',
    })
    query: string;
}

export class MediaTypesArgs {
    @ApiProperty({
        description: 'The type of media to filter',
        type: 'string',
        'enum': [MediaType.MOVIE, MediaType.SHOW],
        enumName: 'MediaType',
    })
    @IsIn([MediaType.MOVIE, MediaType.SHOW])
    type: MediaType;
}

export class FilterGenreArgs extends MediaTypesArgs {
    @IsArray()
    @IsString({ each: true })
    @ApiProperty({
        description: 'The genres to filter',
        type: 'array',
        items: {
            type: 'string',
        },
    })
    genres: string[];

    @IsNumber()
    @ApiProperty({
        description: 'The decade to filter',
        type: 'number',
    })
    @Type(() => Number)
    decade: number;
}

export class FilterMediaArgs extends PaginateArgs {
    @ApiProperty({
        description: 'The type of media to filter',
        type: 'string',
        'enum': [MediaType.MOVIE, MediaType.SHOW],
        enumName: 'MediaType',
    })
    @IsIn([MediaType.MOVIE, MediaType.SHOW])
    type: MediaType;

    @IsArray()
    @IsString({ each: true })
    @ApiProperty({
        description: 'The genres to filter',
        type: [String],
    })
    genres: string[];

    @IsNumber()
    @ApiProperty({
        description: 'The decade to filter',
        type: Number,
    })
    @Type(() => Number)
    decade: number;
}

export class ResetEpisodesArgs {
    @ApiProperty({
        description: 'Whether to reset the episode\'s progress',
        type: Boolean,
    })
    @Type(() => Boolean)
    reset: boolean;
}

export class GetIdFromQueryArgs {
    @IsString()
    @ApiProperty({
        description: 'The search query',
        type: 'string',
    })
    query: string;

    @IsIn(Object.values(FinMediaTypes))
    @ApiProperty({
        description: 'The type of media to filter',
        type: 'string',
        'enum': Object.values(FinMediaTypes),
    })
    type: FinMediaTypes;
}

export class MediaResponseSchema extends SlimMediaSchema {
    @ApiProperty({
        description: 'The popularity of the media item',
        type: Number,
    })
    popularity: number;

    @ApiProperty({
        description: 'The genre of the media item',
        type: String,
    })
    genre: string;

    @ApiProperty({
        description: 'The genres of the media item',
        type: [String],
    })
    genres: string[];

    @ApiProperty({
        description: 'The trailer for the media item',
        type: String,
        nullable: true,
    })
    trailer: string | null;

    @ApiProperty({
        description: 'The overview of the media item',
        type: String,
        nullable: true,
    })
    overview: string | null;

    @ApiProperty({
        description: 'The release date of the media item',
        type: String,
        format: 'date-time',
        nullable: true,
    })
    releaseDate: Date | null;

    @ApiProperty({
        description: 'The rating of the media item',
        type: String,
    })
    rating: string;

    @ApiProperty({
        description: 'The actors of the media item',
        type: [CastResponseSchema],
    })
    actors: CastResponse[];

    @ApiProperty({
        description: 'The writers of the media item',
        type: [CrewResponseSchema],
    })
    writers: CrewResponse[];

    @ApiProperty({
        description: 'The directors of the media item',
        type: [CrewResponseSchema],
    })
    directors: CrewResponse[];

    @ApiProperty({
        description: 'The producers of the media item',
        type: [CrewResponseSchema],
    })
    producers: CrewResponse[];

    @ApiProperty({
        description: 'The extras of the media item',
        type: [MediaExtrasSchema],
    })
    extras: MediaExtras[];

    @ApiProperty({
        description: 'The collection the media item belongs to',
        type: CollectionResponseSchema,
        nullable: true,
    })
    collection: CollectionResponse | null;

    @ApiProperty({
        description: 'The recommended media items',
        type: [SlimMediaSchema],
    })
    recommendations: SlimMedia[];

    @ApiProperty({
        description: 'The companies of the media item',
        type: [CompanyResponseSchema],
    })
    companies: CompanyResponse[];

    @ApiProperty({
        description: 'The vote average of the media item',
        type: Number,
    })
    voteAverage: number;

    @ApiProperty({
        description: 'The runtime of the media item',
        type: String,
    })
    runtime: string;

    @ApiProperty({
        description: 'The sections of the media item',
        type: [String],
        'enum': [
            MediaSection.MORE_LIKE_THIS,
            MediaSection.EXTRAS,
            MediaSection.DETAILS,
            MediaSection.MOST_RELEVANT,
            MediaSection.EPISODES,
            MediaSection.SEASONS,
        ],
        enumName: 'MediaSection',
    })
    sections: MediaSection[];

    @ApiProperty({
        description: 'The seasons of the show',
        type: [SeasonResponseSchema],
    })
    seasons: SeasonResponse[];

    @ApiProperty({
        description: 'The status of the media item',
        type: String,
        nullable: true,
    })
    mediaStatus: string | null;
}

export class NetworkResponseSchema extends CompanyResponseSchema {
    @ApiProperty({
        description: 'The movies the network has produced',
        type: [SlimMediaSchema],
    })
    movies: SlimMedia[];

    @ApiProperty({
        description: 'The shows the network has produced',
        type: [SlimMediaSchema],
    })
    shows: SlimMedia[];
}

export class PersonResponseSchema {
    @ApiProperty({
        description: 'The id of the person',
        type: Number,
    })
    id: number;

    @ApiProperty({
        description: 'The birthday of the person',
        type: String,
        format: 'date-time',
    })
    birthday: Date;

    @ApiProperty({
        description: 'The Gender of the user according to TmDB',
        type: Number,
    })
    gender: number;

    @ApiProperty({
        description: 'The name of the person',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'The biography of the person',
        type: String,
    })
    biography: string;

    @ApiProperty({
        description: 'The profile of the person',
        type: String,
    })
    profile: string;

    @ApiProperty({
        description: 'The media items the person has stared in',
        type: [SlimMediaSchema],
    })
    staredIn: SlimMedia[];

    @ApiProperty({
        description: 'The media items the person has wrote for',
        type: [SlimMediaSchema],
    })
    wroteFor: SlimMedia[];

    @ApiProperty({
        description: 'The media items the person has directed',
        type: [SlimMediaSchema],
    })
    directed: SlimMedia[];

    @ApiProperty({
        description: 'The media items the person has produced',
        type: [SlimMediaSchema],
    })
    produced: SlimMedia[];
}

class SearchedVideoSchema {
    @ApiProperty({
        description: 'The name of the video',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'The id of the video',
        type: String,
    })
    videoId: string;

    @ApiProperty({
        description: 'The backdrop of the video',
        type: String,
    })
    backdrop: string;

    @ApiProperty({
        description: 'The blurred backdrop of the video',
        type: String,
    })
    backdropBlur: string;

    @ApiProperty({
        description: 'The episode of the video',
        type: Number,
        nullable: true,
    })
    episode: number | null;

    @ApiProperty({
        description: 'The season of the video',
        type: Number,
        nullable: true,
    })
    season: number | null;
}

class SearchedMediaSchema extends SlimMediaSchema {
    @ApiProperty({
        description: 'The videos for the media item',
        type: [SearchedVideoSchema],
    })
    videos: SearchedVideo[];
}

export class HomeResponseSlimMediaSchema extends createHomeResponse(SlimMediaSchema) {}

export class PageResponseSlimMediaSchema extends createPageResponse(SlimMediaSchema) {}

export class PageResponseSearchedMediaSchema extends createPageResponse(SearchedMediaSchema) {}

export class TmdbVideoDetailsSchema {
    @ApiProperty({
        description: 'The name of the video',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'The name of the episode',
        type: String,
        nullable: true,
    })
    episodeName: string | null;

    @ApiProperty({
        description: 'The overview of the video',
        type: String,
    })
    overview: string;

    @ApiProperty({
        description: 'The overview of the episode',
        type: String,
        nullable: true,
    })
    episodeOverview: string | null;

    @ApiProperty({
        description: 'The backdrop of the episode',
        type: String,
        nullable: true,
    })
    episodeBackdrop: string | null;
}

export class CollectionPageResponseSchema {
    @ApiProperty({
        description: 'The name of the collection',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'The description of the collection',
        type: String,
    })
    description: string;

    @ApiProperty({
        description: 'The backdrop of the collection',
        type: String,
        nullable: true,
    })
    backdrop: string | null;

    @ApiProperty({
        description: 'The poster of the collection',
        type: String,
        nullable: true,
    })
    poster: string | null;

    @ApiProperty({
        description: 'The media items in the collection',
        type: [DetailedMediaSchema],
    })
    media: DetailedMedia[];
}

export class IdFromQuerySchema {
    @ApiProperty({
        description: 'The id of the media item',
        type: String,
    })
    id: string;

    @ApiProperty({
        description: 'The name of the media item',
        type: String,
    })
    name: string;
}
