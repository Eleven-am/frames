import { spawn } from 'child_process';

import { createBadRequestError, TaskEither } from '@eleven-am/fp';
import { Injectable, Logger } from '@nestjs/common';
import { CloudDrive, Video } from '@prisma/client';
import { Response } from 'express';
import ffmpeg, { ffprobe, FfprobeData } from 'fluent-ffmpeg';

import { STREAM_CACHE_PREFIX_KEY } from './stream.constants';
import { QualityOption, Segments, StreamItem, ThumbnailTimestamp } from './stream.schema';
import { CacheService } from '../cache/cache.service';
import { Playback } from '../playback/playback.schema';
import { PrismaService } from '../prisma/prisma.service';
import { FramesFile } from '../storage/storage.schema';
import { StorageService } from '../storage/storage.service';
import { cache } from '../utils/helper.fp';


@Injectable()
export class StreamService {
    private logger = new Logger(StreamService.name);

    private readonly defaultSegmentLength = 4;

    private readonly qualityOptions: QualityOption[] = [
        {
            name: '1080p',
            width: 1920,
            height: 1080,
            videoBitrate: 7400,
            audioBitrate: 192,
        },
        {
            name: '720p',
            width: 1280,
            height: 720,
            videoBitrate: 4400,
            audioBitrate: 192,
        },
        {
            name: '480p',
            width: 854,
            height: 480,
            videoBitrate: 1600,
            audioBitrate: 128,
        },
    ];

    constructor (
        private readonly storageService: StorageService,
        private readonly prismaService: PrismaService,
        private readonly cacheStore: CacheService,
    ) {}

    getMultiVariantPlaylist (playback: Playback) {
        const m3u8 = [
            '#EXTM3U',
            '#EXT-X-VERSION:3',
            ...this.qualityOptions.map((option) => [
                `#EXT-X-STREAM-INF:BANDWIDTH=${option.videoBitrate}000,RESOLUTION=${option.width}x${option.height}`,
                `${option.name}/playlist.m3u8`,
            ]).flat(),
            '',
        ].join('\n');

        return this.getFileMetadata(playback).map(() => m3u8);
    }

    getSingleVariantPlaylist (streamFile: StreamItem) {
        return [
            '#EXTM3U',
            '#EXT-X-VERSION:3',
            '#EXT-X-TARGETDURATION:4',
            '#EXT-X-MEDIA-SEQUENCE:0',
            '#EXT-X-PLAYLIST-TYPE:VOD',
            ...streamFile.segments.map((segment) => [
                `#EXTINF:${segment.duration},`,
                `${String(segment.index).padStart(3, '0')}.ts`,
            ]).flat(),
            '#EXT-X-ENDLIST',
            '',
        ].join('\n');
    }

    retrieveStreamItem (playbackId: string) {
        return this.cacheStore.get<StreamItem>(`${STREAM_CACHE_PREFIX_KEY}:${playbackId}`);
    }

    getSegment (streamFile: StreamItem, segmentName: string, quality: string, res: Response) {
        const segmentIndex = parseInt(segmentName.replace('.ts', ''), 10);
        const qualityOption = this.qualityOptions.find((option) => option.name === quality);
        const segment = streamFile.segments[segmentIndex];

        if (!qualityOption || !segment) {
            res.status(404).send('Not found');

            return;
        }

        res.set('Content-Type', 'video/mp2t');

        ffmpeg(streamFile.file.path)
            .setStartTime(segment.start)
            .duration(segment.duration)
            .videoCodec('libx264')
            .audioCodec('aac')
            .audioChannels(6)
            .audioBitrate(qualityOption.audioBitrate)
            .videoBitrate(qualityOption.videoBitrate)
            .size(`${qualityOption.width}x${qualityOption.height}`)
            .outputOptions([
                '-crf 20',
                '-g 48',
                '-keyint_min 48',
                '-sc_threshold 0',
                '-movflags +faststart',
                `-maxrate ${qualityOption.videoBitrate}k`,
                `-bufsize ${qualityOption.videoBitrate * 2}k`,
                '-force_key_frames expr:gte(t,n_forced*4)',
                '-f mpegts',
            ])
            .on('error', (err) => {
                this.logger.error(`Failed to transcode segment ${segmentName} with quality ${quality}`, err);
            })
            .on('end', () => {
                this.logger.log(`Transcode successful for segment ${segmentName} with quality ${quality}`);
            })
            .pipe(res, { end: true });
    }

    streamVideo (playback: Playback, res: Response, range: string) {
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

    buildStreamUrl (playbackId: string, video: Video) {
        const isCompatible = this.getMetadata(video)
            .map(() => `/api/stream/${playbackId}/playlist.m3u8`)
            .orElse(() => TaskEither.of(`/api/stream/${playbackId}`));

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

    getThumbnails (playback: Playback) {
        return TaskEither
            .tryCatch(
                () => this.prismaService.artwork.findMany({
                    where: {
                        videoId: playback.videoId,
                    },
                    orderBy: {
                        percentage: 'asc',
                    },
                }),
            );
    }

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

    private getFileMetadata (playback: Playback) {
        return this.checkLocalStorage(playback.video)
            .chain(() => this.getMetadata(playback.video))
            .filter(
                ({ metadata }) => Boolean(metadata.format && metadata.format.duration),
                () => createBadRequestError('Failed to get video duration'),
            )
            .map(({ metadata, file }): StreamItem => {
                const duration = parseFloat(String(metadata.format.duration));
                const segments = this.createSegments(duration);

                return {
                    file,
                    metadata,
                    segments,
                    videoId: playback.videoId,
                    userId: playback.userId,
                };
            })

        // .chain((data) => this.createKeyframeSegments(playback, data.metadata, data.file))
            .mapValue(cache({
                ttl: 60 * 60 * 3,
                key: `${STREAM_CACHE_PREFIX_KEY}:${playback.id}`,
                store: this.cacheStore,
            }));
    }

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

    private isVideoPlayableInBrowsers (metadata: FfprobeData) {
        const supportedVideoCodecs = ['h264', 'hevc'];
        const supportedAudioCodecs = ['aac', 'ac3', 'eac3'];
        const supportedContainers = ['mp4', 'mov', 'm4v'];

        let hasValidVideoCodec = false;
        let hasValidAudioCodec = false;
        let hasValidContainer = false;

        for (const stream of metadata.streams) {
            if (stream.codec_type === 'video' && supportedVideoCodecs.includes(stream.codec_name?.toLowerCase() || '')) {
                hasValidVideoCodec = true;
            }

            if (stream.codec_type === 'audio' && supportedAudioCodecs.includes(stream.codec_name?.toLowerCase() || '')) {
                hasValidAudioCodec = true;
            }
        }

        if (metadata.format && metadata.format.format_name) {
            const containerFormats = metadata.format.format_name.split(',');

            hasValidContainer = containerFormats.some((format) => supportedContainers.includes(format.trim().toLowerCase()));
        }

        return hasValidVideoCodec && hasValidAudioCodec && hasValidContainer;
    }

    private createSegments (duration: number) {
        const floor = Math.floor(duration / this.defaultSegmentLength);

        const segments: Segments[] = Array.from({ length: floor }, (_, index) => {
            const start = index * this.defaultSegmentLength;
            const end = start + this.defaultSegmentLength;


            return {
                start,
                end,
                index,
                duration: this.defaultSegmentLength.toFixed(6),
            };
        });

        const remainder = duration % this.defaultSegmentLength;

        if (remainder > 0) {
            segments.push({
                start: floor * this.defaultSegmentLength,
                end: duration,
                index: floor,
                duration: remainder.toFixed(6),
            });
        }

        return segments;
    }

    private checkLocalStorage (video: Video) {
        return TaskEither
            .tryCatch(
                () => this.prismaService.cloudStorage.findUnique({
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

    private getMetadata (video: Video) {
        return this.storageService.getObjectFromVideo(video)
            .chain((file) => this.getFFProbeMetadata(file)
                .filter(
                    (metadata) => !this.isVideoPlayableInBrowsers(metadata),
                    () => createBadRequestError('Transcoding is not required'),
                )
                .map((metadata) => ({
                    file,
                    metadata,
                })));
    }

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

        return TaskEither.tryTimed(() => promise, 30 * 1000);
    }

    private createBase64Thumbnail (file: FramesFile, video: Video, time: ThumbnailTimestamp) {
        const createThumbnail = (base64: string) => TaskEither
            .tryCatch(
                () => this.prismaService.artwork.create({
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

        const saveThumbnail = (task: TaskEither<string>) => TaskEither
            .tryCatch(
                () => this.prismaService.artwork.findFirst({
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
            .mapValue(saveThumbnail);
    }

    private extractKeyframes (file: FramesFile) {
        return new Promise<number[]>((resolve, reject) => {
            const ffprobe = spawn('ffprobe', [
                '-loglevel',
                'error',
                '-select_streams',
                'v:0',
                '-show_entries',
                'packet=pts_time,flags',
                '-of',
                'csv=print_section=0',
                file.path,
            ]);

            let output = '';

            ffprobe.stdout.on('data', (data) => {
                output += data.toString();
            });

            ffprobe.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`FFprobe process exited with code ${code}`));
                } else {
                    const keyframes = output
                        .split('\n')
                        .filter((line) => line.includes(',K'))
                        .map((line) => parseFloat(line.split(',')[0]));

                    resolve(keyframes);
                }
            });

            ffprobe.on('error', (err) => {
                reject(err);
            });
        });
    }

    private createKeyframeAlignedSegments (duration: number, keyframes: number[]): Segments[] {
        const segments: Segments[] = [];
        let lastKeyframe = 0;

        for (const keyframe of keyframes) {
            if (keyframe - lastKeyframe >= this.defaultSegmentLength || keyframe === keyframes[keyframes.length - 1]) {
                segments.push({
                    start: lastKeyframe,
                    end: keyframe,
                    index: segments.length,
                    duration: (keyframe - lastKeyframe).toFixed(6),
                });
                lastKeyframe = keyframe;
            }
        }

        if (lastKeyframe < duration) {
            segments.push({
                start: lastKeyframe,
                end: duration,
                index: segments.length,
                duration: (duration - lastKeyframe).toFixed(6),
            });
        }

        return segments;
    }

    private createKeyframeSegments (playback: Playback, metadata: FfprobeData, file: FramesFile) {
        return TaskEither
            .fromNullable(metadata.format.duration)
            .chain((duration) => TaskEither
                .tryCatch(
                    () => this.extractKeyframes(file),
                    'Failed to extract keyframes',
                )
                .map((keyframes) => this.createKeyframeAlignedSegments(duration, keyframes)))
            .map((segments): StreamItem => ({
                file,
                metadata,
                segments,
                videoId: playback.videoId,
                userId: playback.userId,
            }));
    }
}
