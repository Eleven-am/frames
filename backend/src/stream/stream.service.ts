import { createBadRequestError, TaskEither } from '@eleven-am/fp';
import { Injectable } from '@nestjs/common';
import { CloudDrive, Video } from '@prisma/client';
import { Response } from 'express';
import ffmpeg, { ffprobe, FfprobeData } from 'fluent-ffmpeg';

import { ThumbnailTimestamp } from './stream.schema';
import { Playback } from '../playback/playback.schema';
import { PrismaService } from '../prisma/prisma.service';
import { FramesFile } from '../storage/storage.schema';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class StreamService {
    constructor (
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
    ) {}

    /**
   * Checks if the video is supported for direct play
   * @param video The video object
   */
    public isDirectPlaySupported (video: Video) {
        return this.checkLocalStorage(video)
            .orElse(() => TaskEither.of(false))
            .matchTask([
                {
                    predicate: (isLocal) => isLocal,
                    run: () => TaskEither.of(
                        ['mp4', 'm4v'].some((ext) => video.location.endsWith(ext)),
                    ),
                },
                {
                    predicate: (isLocal) => !isLocal,
                    run: () => TaskEither.of(false),
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
            .map(
                ({
                    headers: {
                        contentDisposition,
                        contentType,
                        contentLength,
                        contentRange,
                    },
                    stream,
                }) => {
                    res.setHeader('Content-Type', contentType);
                    res.setHeader('Content-Range', contentRange);
                    res.setHeader('Content-Length', contentLength);
                    res.setHeader('Content-Disposition', contentDisposition);
                    res.setHeader('Accept-Ranges', 'bytes');
                    res.status(206);

                    stream.pipe(res);
                },
            );
    }

    /**
   * Checks if the video is stored in local storage
   * @param video The video object
   */
    private checkLocalStorage (video: Video) {
        return TaskEither.tryCatch(
            () => this.prisma.cloudStorage.findUnique({
                where: { id: video.cloudStorageId },
            }),
            'Failed to get cloud storage',
        )
            .nonNullable('No cloud storage found')
            .filter(
                (cloudStorage) => cloudStorage.drive === CloudDrive.LOCAL,
                () => createBadRequestError('Cannot transcode remote files'),
            )
            .map(() => true);
    }

    /**
     * Retrieves thumbnails for a given playback
     * @param playback The playback object containing video information
     */
    getThumbnails (playback: Playback) {
        return TaskEither
            .tryCatch(
                () => this.prisma.artwork.findMany({
                    where: {
                        videoId: playback.videoId,
                    },
                    orderBy: {
                        percentage: 'asc',
                    },
                }),
            );
    }

    /**
     * Produces thumbnails for the given video at specified intervals
     * @param video The video object
     * @param interval The interval in seconds for thumbnail generation
     */
    produceThumbnails (video: Video, interval = 10) {
        const getSeconds = (probe: FfprobeData): ThumbnailTimestamp[] => {
            const duration = parseFloat(String(probe.format.duration));
            const numberOfThumbnails = Math.ceil(duration / interval);

            return Array.from({ length: numberOfThumbnails }, (_, index) => ({
                timeInSec: Math.min(index * interval, duration),
                percentage: Math.min((index * interval) / duration, 1),
            }));
        };

        return this.storageService.getObjectFromVideo(video)
            .chain((file) => this.getFFProbeMetadata(file)
                .map(getSeconds)
                .executeSequentially((time) => this.createBase64Thumbnail(file, video, time)));
    }

    /**
     * Retrieves metadata for the given file using ffprobe
     * @param file The FramesFile object containing the file path
     * @private
     */
    private getFFProbeMetadata (file: FramesFile) {
        const promise = new Promise<FfprobeData>((resolve, reject) => {
            ffprobe(file.path, (err, metadata) => {
                if (err) {
                    reject(err);
                }

                resolve(metadata);
            });
        });

        return TaskEither
            .tryCatch(
                () => promise,
                'Failed to get file metadata',
            );
    }

    /**
     * Creates a thumbnail for the given file at the specified time
     * @param file The FramesFile object containing the file path
     * @param timeSeconds The time in seconds to create the thumbnail
     * @returns A TaskEither that resolves to a writable stream of the thumbnail image
     * @private
     */
    private createThumbnail (file: FramesFile, timeSeconds: number) {
        const promise = new Promise<NodeJS.WritableStream>((resolve, reject) => {
            const ffmpegStream = ffmpeg(file.path)
                .on('error', (err) => reject(err))
                .frames(1)
                .seekInput(timeSeconds)
                .outputOptions([
                    '-vf scale=640:360',
                    '-vframes 1',
                    '-f image2',
                ])
                .toFormat('image2')
                .pipe();

            resolve(ffmpegStream);
        });

        return TaskEither
            .tryCatch(
                () => promise,
                'Failed to create thumbnail',
            )
            .timed(30_000);
    }

    /**
     * Converts a writable stream to a base64 string
     * @param stream The writable stream to convert
     * @returns A TaskEither that resolves to the base64 string
     * @private
     */
    private writeableToBase64 (stream: NodeJS.WritableStream) {
        const promise = new Promise<string>((resolve, reject) => {
            const chunks: Buffer[] = [];

            stream.on('data', (chunk) => {
                chunks.push(chunk);
            });

            stream.on('end', () => {
                resolve(Buffer.concat(chunks).toString('base64'));
            });

            stream.on('error', (err) => {
                reject(err);
            });
        });

        return TaskEither.tryCatch(() => promise, 'Failed to convert stream to base64');
    }

    /**
     * Creates a base64 thumbnail for the given file and video at the specified time
     * @param file The FramesFile object containing the file path
     * @param video The Video object to associate the thumbnail with
     * @param time The ThumbnailTimestamp object containing time and percentage
     * @returns A TaskEither that resolves to the created thumbnail or an error
     * @private
     */
    private createBase64Thumbnail (file: FramesFile, video: Video, time: ThumbnailTimestamp) {
        const createThumbnail = (base64: string) => TaskEither
            .tryCatch(
                () => this.prisma.artwork.create({
                    data: {
                        url: base64.trim(),
                        percentage: time.percentage,
                        video: {
                            connect: {
                                id: video.id,
                            },
                        },
                    },
                }),
                'Failed to save thumbnail',
            );

        const getThumbnail = (task: TaskEither<string>) => TaskEither
            .tryCatch(
                () => this.prisma.artwork.findFirst({
                    where: {
                        percentage: time.percentage,
                        videoId: video.id,
                    },
                }),
            )
            .nonNullable('Thumbnail does not exist')
            .orElse(() => task.chain(createThumbnail));

        return this.createThumbnail(file, time.timeInSec)
            .chain(this.writeableToBase64)
            .map((base64) => `data:image/jpeg;base64,${base64}`)
            .mapValue(getThumbnail);
    }
}
