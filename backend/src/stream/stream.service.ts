import { Injectable, OnModuleInit, StreamableFile } from "@nestjs/common";
import { HLSController, StreamType } from "@eleven-am/transcoder";
import type { MediaMetadata } from "@eleven-am/transcoder/types";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { HLS_CACHE_DIRECTORY } from "./stream.constants";
import {createBadRequestError, createNotFoundError, TaskEither} from "@eleven-am/fp";
import { CloudDrive, Video } from "@prisma/client";
import { Playback } from "../playback/playback.schema";
import { CacheService } from "../cache/cache.service";
import { CachedSession } from "../session/session.contracts";
import {
    AudioOptionWithSegment,
    AudiOptions, ScreenShotOptions,
    VideoOptions,
    VideoOptionWithSegment,
} from "./stream.contracts";
import * as stream from "node:stream";
import { Response } from "express";
import { StorageService } from "../storage/storage.service";
import {parseSync} from "subtitle";
import {NodeCueData} from "../subtitles/subtitles.contracts";
import {HLSService} from "./hls.service";

@Injectable()
export class StreamService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
    ) {}
    
    /**
     * Builds the stream URL for the given playback ID and video
     * @param playbackId The ID of the playback
     * @param video The video object
     */
    public buildStreamUrl(playbackId: string, video: Video) {
        const isCompatible = TaskEither.of(video).matchTask([
            {
                predicate: (video) =>
                    ["mp4", "m4v"].some((ext) => video.location.endsWith(ext)),
                run: () => TaskEither.of(`/api/stream/${playbackId}`),
            },
            {
                predicate: () => true,
                run: () => TaskEither.of(`/api/stream/${playbackId}/master.m3u8`),
            },
        ]);
        
        return this.checkLocalStorage(video)
            .orElse(() => TaskEither.of(false))
            .matchTask([
                {
                    predicate: (isLocal) => isLocal,
                    run: () => isCompatible,
                },
                {
                    predicate: (isLocal) => !isLocal,
                    run: () => TaskEither.of(`/stream/${playbackId}`),
                },
            ]);
    }
    
    /**
     * Streams the video data for the given playback
     * @param playback The playback object containing video information
     * @param res The response object to send the video data
     * @param range The range of bytes to stream
     */
    public streamVideo (playback: Playback, res: Response, range: string) {
        return this.storageService
            .getStreamDataFromVideo(playback.video, range)
            .map(({ headers: { contentDisposition, contentType, contentLength, contentRange }, stream }) => {
                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Range', contentRange);
                res.setHeader('Content-Length', contentLength);
                res.setHeader('Content-Disposition', contentDisposition);
                res.setHeader('Accept-Ranges', 'bytes');
                res.status(206);
                
                stream.pipe(res);
            });
    }
    
    /**
     * Checks if the video is stored in local storage
     * @param video The video object
     */
    private checkLocalStorage(video: Video) {
        return TaskEither.tryCatch(
            () =>
                this.prisma.cloudStorage.findUnique({
                    where: { id: video.cloudStorageId },
                }),
            "Failed to get cloud storage",
        )
            .nonNullable("No cloud storage found")
            .filter(
                (cloudStorage) => cloudStorage.drive === CloudDrive.LOCAL,
                () => createBadRequestError("Cannot transcode remote files"),
            )
            .map(() => true);
    }
}
