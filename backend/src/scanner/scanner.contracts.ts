import { BaseEpisode } from '@eleven-am/tmdbapi';
import { ApiProperty } from '@nestjs/swagger';
import { CastType, Company, MediaType, Media, CloudStorage, CloudDrive } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUrl } from 'class-validator';

import { ScannedImages } from '../images/images.contracts';
import { FramesFile } from '../storage/storage.schema';
import { PaginateArgs, createPageResponse } from '../utils/utils.contracts';

export interface ScanPick {
    name: string;
    tmdbId: number;
    backdrop: string | null;
    popularity: number;
    drift: number;
    year: number;
    type: MediaType;
}

export interface ScanEpisodeResult {
    file: FramesFile;
    imdbId: string | null;
    tmdbEpisode: BaseEpisode | null;
    episode: number;
    season: number;
}

export interface Credit {
    name: string;
    character: string | null;
    job: string | null;
    tmdbId: number;
    type: CastType;
}

export interface ScanResult {
    file: FramesFile;
    name: string;
    tmdbId: number;
    imdbId: string | null;
    images: ScannedImages;
    type: MediaType;
    credits: Credit[];
    genres: string[];
    releaseDate: Date | null;
    popularity: number;
    actors: string[];
    directors: string[];
    voteAverage: number;
    trailer: string | null;
    overview: string | null;
    companies: Omit<Company, 'id' | 'created' | 'updated'>[];
}

export interface FramesGuessResult {
    name: string;
    year: number;
    season: number | null;
    episode: number | null;
}

export enum LibraryScanType {
    ALL = 'all',
    MOVIE = 'movie',
    SHOW = 'show',
}

export class NewMediaEvent {
    constructor (
        public readonly file: FramesFile,
        public readonly type: MediaType,
    ) {}
}

export class NewEpisodesEvent {
    constructor (
        public readonly show: Media,
    ) {}
}

export class ScanLibraryEvent {
    constructor (
        public readonly library: CloudStorage,
        public readonly type: LibraryScanType,
    ) {}
}

export class StorageDetailSchema {
    @ApiProperty({
        description: 'The name of the storage',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'The owner of the storage',
        type: String,
    })
    owner: string;

    @ApiProperty({
        description: 'The storage ID of the storage',
        type: String,
    })
    storageId: string;

    @ApiProperty({
        description: 'The type of storage',
        'enum': CloudDrive,
        enumName: 'CloudDrive',
    })
    storageType: string;

    @ApiProperty({
        description: 'The number of movies in the storage',
        type: Number,
    })
    movies: number;

    @ApiProperty({
        description: 'The number of shows in the storage',
        type: Number,
    })
    shows: number;

    @ApiProperty({
        description: 'The number of un scanned movies in the storage',
        type: Number,
    })
    unScannedMovies: number;

    @ApiProperty({
        description: 'The number of un scanned shows in the storage',
        type: Number,
    })
    unScannedShows: number;

    @ApiProperty({
        description: 'If the storage has movie locations',
        type: Boolean,
    })
    hasMovieLocations: boolean;

    @ApiProperty({
        description: 'If the storage has show locations',
        type: Boolean,
    })
    hasShowLocations: boolean;
}

export class UnScannedItemSchema {
    @ApiProperty({
        description: 'The name of the media',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'The tmdb ID of the media',
        type: Number,
    })
    tmdbId: number;

    @ApiProperty({
        description: 'The year the media was released',
        type: Number,
    })
    year: number;

    @ApiProperty({
        description: 'The poster of the media',
        type: String,
        nullable: true,
    })
    poster: string | null;

    @ApiProperty({
        description: 'The filename of the media',
        type: String,
    })
    filename: string;

    @ApiProperty({
        description: 'The filepath of the media',
        type: String,
    })
    filepath: string;

    @ApiProperty({
        description: 'The blurred poster of the media',
        type: String,
        nullable: true,
    })
    posterBlur: string | null;

    @ApiProperty({
        description: 'The name of the storage the item is in',
        type: String,
    })
    storageName: string;

    @ApiProperty({
        description: 'The storage ID of the storage the item is in',
        type: String,
    })
    storageId: string;

    @ApiProperty({
        description: 'The username of the owner of the storage',
        type: String,
    })
    owner: string;

    @ApiProperty({
        description: 'The type of media',
        'enum': MediaType,
        enumName: 'MediaType',
    })
    type: MediaType;
}

class FrontImageSchema {
    @IsString()
    @IsOptional()
    @ApiProperty({
        description: 'The language of the image',
        type: String,
        nullable: true,
    })
    language: string | null;

    @IsEnum(['APPLE', 'TmDB', 'X-ART'])
    @ApiProperty({
        description: 'The source of the image',
    })
    source: 'APPLE' | 'TmDB' | 'X-ART';

    @IsNumber()
    @IsPositive()
    @ApiProperty({
        description: 'The year of the image',
    })
    year: number;

    @IsNumber()
    @IsPositive()
    @ApiProperty({
        description: 'The drift of the image',
    })
    drift: number;

    @IsNumber()
    @IsPositive()
    @ApiProperty({
        description: 'The likes of the image',
    })
    likes: number;

    @IsUrl()
    @ApiProperty({
        description: 'The URL of the image',
    })
    url: string;

    @IsString()
    @ApiProperty({
        description: 'The name of the media the image is for',
    })
    name: string;
}

class UpsertMediaSchema {
    @IsNumber()
    @IsPositive()
    @ApiProperty({
        description: 'The ID of the media on TMDB',
    })
    tmdbId: number;

    @IsEnum(MediaType)
    @ApiProperty({
        description: 'The type of media',
        'enum': MediaType,
        enumName: 'MediaType',
    })
    type: MediaType;

    @IsUrl()
    @ApiProperty({
        description: 'The poster URL to use for the media',
    })
    poster: string;

    @IsUrl()
    @ApiProperty({
        description: 'The backdrop URL to use for the media',
    })
    backdrop: string;

    @IsUrl()
    @ApiProperty({
        description: 'The portrait URL to use for the media',
    })
    portrait: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        description: 'The logo URL to use for the media',
        type: String,
        nullable: true,
    })
    logo: string | null;
}

export class FrontImagesSchema {
    @ApiProperty({
        description: 'The backdrops of the media',
        type: [FrontImageSchema],
    })
    backdrops: FrontImageSchema[];

    @ApiProperty({
        description: 'The posters of the media',
        type: [FrontImageSchema],
    })
    posters: FrontImageSchema[];

    @ApiProperty({
        description: 'The logos of the media',
        type: [FrontImageSchema],
    })
    logos: FrontImageSchema[];


    @ApiProperty({
        description: 'The portraits of the media',
        type: [FrontImageSchema],
    })
    portraits: FrontImageSchema[];
}

export class EditMediaSchema extends UpsertMediaSchema {
    @IsString()
    @ApiProperty({
        description: 'The ID of the media to edit',
    })
    id: string;

    @IsString()
    @ApiProperty({
        description: 'The name of the media',
    })
    name: string;
}

export class GetMediaSchema extends EditMediaSchema {
    @ApiProperty({
        description: 'The name of the file or folder the media is stored in',
    })
    fileName: string;
}

export class GetImagesSchema {
    @IsNumber()
    @ApiProperty({
        description: 'The tmdbId of the media to get images for',
    })
    @Transform(({ value }) => Number(value))
    tmdbId: number;

    @IsEnum(MediaType)
    @ApiProperty({
        description: 'The type of media',
        'enum': MediaType,
        enumName: 'MediaType',
    })
    type: MediaType;
}

export class EpisodeFileSchema {
    @IsString()
    @ApiProperty({
        description: 'The path to the episode file',
    })
    fileName: string;

    @IsString()
    @ApiProperty({
        description: 'The episode id for the episode in the database',
    })
    episodeId: string;

    @IsNumber()
    @IsPositive()
    @ApiProperty({
        description: 'The season number of the episode',
    })
    season: number;

    @IsNumber()
    @IsPositive()
    @ApiProperty({
        description: 'The episode number of the episode',
    })
    episode: number;
}

export class TmdbMediaSchema {
    @IsNumber()
    @ApiProperty({
        description: 'The tmdbId of the media',
    })
    @Transform(({ value }) => Number(value))
    tmdbId: number;

    @IsString()
    @ApiProperty({
        description: 'The name of the media',
    })
    name: string;

    @IsNumber()
    @IsPositive()
    @ApiProperty({
        description: 'The year of the media',
    })
    year: number;
}

export class CreateFromTmdbIdArgs extends GetImagesSchema {
    @IsString()
    @ApiProperty({
        description: 'The filepath of the media',
    })
    filepath: string;

    @IsString()
    @ApiProperty({
        description: 'The storage ID of the media',
    })
    storageId: string;
}

export class CreateMediaArgs extends UpsertMediaSchema {
    @IsString()
    @ApiProperty({
        description: 'The file path of the media',
    })
    filepath: string;

    @IsString()
    @ApiProperty({
        description: 'The storage ID of the media',
    })
    storageId: string;
}

export class PageResponseUnScannedItemSchema extends createPageResponse(UnScannedItemSchema) {}

export class UnScannedArgs extends PaginateArgs {
    @IsString()
    @ApiProperty({
        description: 'The query to search for',
    })
    search: string;
}
