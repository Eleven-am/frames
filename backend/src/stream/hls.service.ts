import { HLSController, StreamType } from "@eleven-am/transcoder";
import { Injectable, OnModuleInit, StreamableFile } from "@nestjs/common";
import { CacheService } from "../cache/cache.service";
import {
	DatabaseConnector,
	type MediaMetadata, SegmentStream,
} from "@eleven-am/transcoder/types";
import { ConfigService } from "@nestjs/config";
import { HLS_CACHE_DIRECTORY } from "./stream.constants";
import { Playback } from "../playback/playback.schema";
import { CachedSession } from "../session/session.contracts";
import {
	AudioOptionWithSegment,
	AudiOptions,
	HLSSubtitleInfoSchema,
	ScreenShotOptions,
	VideoOptions,
	VideoOptionWithSegment,
} from "./stream.contracts";
import { Response } from "express";
import { parseSync } from "subtitle";
import {
	createBadRequestError,
	createNotFoundError,
	TaskEither,
} from "@eleven-am/fp";
import { NodeCueData, SubtitleInfo } from "../subtitles/subtitles.contracts";
import {CloudDrive, Video} from "@prisma/client";
import { Readable } from "stream";
import { LanguageService } from "../language/language.service";
import {PrismaService} from "../prisma/prisma.service";

@Injectable()
export class HLSService extends HLSController implements OnModuleInit {
	constructor(
		cacheStore: CacheService,
		configService: ConfigService,
		private readonly prisma: PrismaService,
		private readonly languageService: LanguageService,
	) {
		super({
			hwAccel: true,
			database: HLSService.buildDatabaseConnector(cacheStore),
			cacheDirectory: configService.getOrThrow<string>(HLS_CACHE_DIRECTORY),
		});
	}
	
	/**
	 * Build a database connector for HLS service using the provided cache store
	 * @param cacheStore Cache service to use for metadata storage
	 * @private
	 */
	private static buildDatabaseConnector(cacheStore: CacheService): DatabaseConnector {
		return {
			getMetadata: (fileId: string) => HLSService.getMetadata(cacheStore, fileId),
			metadataExists: (fileId: string) => HLSService.metadataExists(cacheStore, fileId),
			saveMetadata: (fileId: string, metadata: MediaMetadata) => HLSService.saveMetadata(cacheStore, fileId, metadata),
		};
	}
	
	/**
	 * Check if metadata exists for the given file ID
	 * @param cacheStore Cache service to check for metadata
	 * @param fileId Unique identifier for the media file
	 * @private
	 */
	private static metadataExists(cacheStore: CacheService, fileId: string) {
		return cacheStore
			.has(fileId)
			.map((exists) => ({
				exists,
				fileId,
			}))
			.toPromise();
	}
	
	/**
	 * Save media metadata for the given file ID
	 * @param cacheStore Cache service to save metadata
	 * @param fileId Unique identifier for the media file
	 * @param metadata The media metadata to save
	 */
	private static saveMetadata(
		cacheStore: CacheService,
		fileId: string,
		metadata: MediaMetadata,
	) {
		return cacheStore
			.set(fileId, metadata)
			.map(() => metadata)
			.toPromise();
	}
	
	/**
	 * Retrieve media metadata for the given file ID
	 * @param cacheStore Cache service to retrieve metadata
	 * @param fileId Unique identifier for the media file
	 */
	private static getMetadata(cacheStore: CacheService, fileId: string) {
		return cacheStore.get<MediaMetadata>(fileId).toPromise();
	}
	
	/**
	 * Initializes the HLS service when the module is loaded
	 */
	async onModuleInit() {
		await this.initialize();
	}
	
	/**
	 * Retrieves the master playlist for the given playback
	 * @param playback The playback object containing video information
	 * @param session The session object containing user information
	 */
	public getMasterRendition(playback: Playback, session: CachedSession) {
		return this.getFilePath(playback).fromPromise((filePath) =>
			this.getMasterPlaylist(filePath, session.session),
		);
	}
	
	/**
	 * Retrieves the Audio rendition playlist for the given playback
	 * @param playback The playback object containing video information
	 * @param session The session object containing user information
	 * @param options The options for the audio rendition
	 */
	public getAudioRenditionPlaylist(
		playback: Playback,
		session: CachedSession,
		options: AudiOptions,
	) {
		return this.getFilePath(playback).fromPromise((filePath) =>
			this.getIndexPlaylist(
				filePath,
				session.session,
				StreamType.AUDIO,
				options.quality,
				options.streamIndex,
			),
		);
	}
	
	/**
	 * Retrieves the Video rendition playlist for the given playback
	 * @param playback The playback object containing video information
	 * @param session The session object containing user information
	 * @param options The options for the video rendition
	 */
	public getVideoRenditionPlaylist(
		playback: Playback,
		session: CachedSession,
		options: VideoOptions,
	) {
		return this.getFilePath(playback).fromPromise((filePath) =>
			this.getIndexPlaylist(
				filePath,
				session.session,
				StreamType.VIDEO,
				options.quality,
				options.streamIndex,
			),
		);
	}
	
	/**
	 * Retrieves the video segment stream for the given playback
	 * @param playback The playback object containing video information
	 * @param session The session object containing user information
	 * @param options The options for the segment stream
	 */
	public getVideoSegmentStream(
		playback: Playback,
		session: CachedSession,
		options: VideoOptionWithSegment,
	) {
		return this.getFilePath(playback)
			.fromPromise((filePath) =>
				this.getSegmentStream(
					filePath,
					session.session,
					StreamType.VIDEO,
					options.quality,
					options.streamIndex,
					options.segment,
				),
			)
			.mapValue(this.handleSegmentStream);
	}
	
	/**
	 * Retrieves the audio segment stream for the given playback
	 * @param playback The playback object containing video information
	 * @param session The session object containing user information
	 * @param options The options for the segment stream
	 */
	public getAudioSegmentStream(
		playback: Playback,
		session: CachedSession,
		options: AudioOptionWithSegment,
	) {
		return this.getFilePath(playback)
			.fromPromise((filePath) =>
				this.getSegmentStream(
					filePath,
					session.session,
					StreamType.AUDIO,
					options.quality,
					options.streamIndex,
					options.segment,
				),
			)
			.mapValue(this.handleSegmentStream);
	}
	
	/**
	 * Retrieves the subtitle playlist for the given playback
	 * @param playback The playback object containing video information
	 * @param streamIndex The index of the subtitle stream
	 */
	public retrieveVTTSubtitle(playback: Playback, streamIndex: number) {
		const getSubtitleInfo = (filePath: string) => TaskEither
			.tryCatch(
				() => this.getConvertibleSubtitles(filePath),
				"Failed to retrieve convertible subtitles",
			)
			.filterItems(
				(item) => item.index !== streamIndex && item.language !== null,
			)
			.map(([info]) => info)
			.nonNullable("Subtitle not found")
			.map((info): SubtitleInfo => {
				const language = this.languageService.getLanguage(info.language!);
				
				return {
					nodes: [],
					id: `${playback.id}-${info.index}`,
					offset: 0,
					subtitleUrl: `/api/stream/${playback.id}/subtitle/${info.index}.vtt`,
					label: language.languageName,
					srcLang: language.languageCode,
				};
			});
		
		const getCues = (filePath: string) => TaskEither
			.tryCatch(
				() => this.getVTTSubtitle(filePath, streamIndex),
				"Failed to retrieve VTT subtitle stream",
			)
			.map(parseSync)
			.filter(
				(items) => items.length > 1,
				() => createNotFoundError("No subtitles found"),
			)
			.filterItems((item) => item.type === "cue")
			.mapItems((item) => item.data as NodeCueData);
		
		const buildSubtitle = (filePath: string) => TaskEither
			.fromBind({
				info: getSubtitleInfo(filePath),
				cues: getCues(filePath),
			}).map(
				({ info, cues }): SubtitleInfo => ({
					...info,
					nodes: cues,
				}),
			);
		
		return this.getFilePath(playback).chain((filePath) =>
			buildSubtitle(filePath),
		);
	}
	
	/**
	 * Retrieves the thumbnail for the given playback
	 * @param video The Video object containing video information
	 * @param options The options for generating the thumbnail
	 */
	public generateThumbnail(video: Video, options: ScreenShotOptions) {
		return this.getFilePathFromVideo(video)
			.fromPromise((filePath) =>
				this.generateScreenshot(
					filePath,
					options.quality,
					options.streamIndex,
					options.timestamp,
				),
			)
			.mapValue(this.handleThumbnailStream);
	}
	
	/**
	 * Gets the convertible subtitles for the given playback
	 * @param playback The playback object containing video information
	 */
	public retrieveConvertibleSubtitles(playback: Playback) {
		return this.getFilePath(playback)
			.fromPromise((filePath) => this.getConvertibleSubtitles(filePath))
			.filterItems((item) => item.index !== null && item.language !== null)
			.mapItems(
				(item): HLSSubtitleInfoSchema => ({
					index: item.index!,
					language: item.language!,
					url: `/api/stream/${playback.id}/subtitle/${item.index}.vtt`,
				}),
			);
	}
	
	/**
	 * Retrieves the absolute path of the media file
	 * @param playback
	 * @private
	 */
	private getFilePath(playback: Playback) {
		return TaskEither.of(playback)
			.filter(
				(playback) => playback.video.cloudStorage.drive === CloudDrive.LOCAL,
				() => createBadRequestError("Playback video is not local"),
			)
			.map((playback) => playback.video.location);
	}
	
	/**
	 * Retrieves the absolute path of the media file from the Video object
	 * @param video The Video object containing cloud storage information
	 * @private
	 */
	private getFilePathFromVideo(video: Video) {
		return TaskEither
			.tryCatch(
				() => this.prisma.cloudStorage.findUnique({
					where: { id: video.cloudStorageId },
				}),
				'Failed to get cloud storage',
			)
			.nonNullable('No cloud storage found')
			.filter(
				(cloudStorage) => cloudStorage.drive === CloudDrive.LOCAL,
				() => createBadRequestError("Cannot transcode remote files"),
			)
			.map(() => video.location);
	}
	
	/**
	 * Handles the stream response by setting appropriate headers and returning a StreamableFile
	 * @param streamTask TaskEither containing the SegmentStream
	 * @private
	 */
	private handleSegmentStream(streamTask: TaskEither<SegmentStream>) {
		return streamTask
			.map(({ stream, size }) => new StreamableFile(
				stream,
				{
					type: "video/mp2t",
					length: size,
				},
			))
	}
	
	/**
	 * Handles the stream response by setting appropriate headers and returning a Readable stream
	 * @param streamTask The Readable stream to handle
	 * @private
	 */
	private handleThumbnailStream(streamTask: TaskEither<Readable>) {
		return streamTask
			.map((stream) => new StreamableFile(
				stream,
				{
					type: "image/jpeg",
				},
			));
	}
}
