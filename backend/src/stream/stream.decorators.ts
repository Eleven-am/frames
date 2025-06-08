import {applyDecorators} from "@nestjs/common";
import {ApiParam} from "@nestjs/swagger";
import {AudioQualityEnum, VideoQualityEnum} from "@eleven-am/transcoder/types";

export function ApiAudioStreamQuality () {
    return applyDecorators(
        ApiParam({
            description: 'The quality of the audio stream',
            enumName: 'audioQuality',
            name: 'quality',
            'enum': [AudioQualityEnum.AAC, AudioQualityEnum.ORIGINAL],
        }),
    );
}

export function ApiStreamIndex () {
    return applyDecorators(
        ApiParam({
            description: 'The index of the stream',
            name: 'streamIndex',
            type: Number,
        }),
    );
}

export function ApiVideoStreamQuality () {
    return applyDecorators(
        ApiParam({
            description: 'The quality of the video stream',
			enumName: 'videoQuality',
			name: 'quality',
            'enum': [
                VideoQualityEnum.P240,
                VideoQualityEnum.P360,
                VideoQualityEnum.P480,
                VideoQualityEnum.P720,
                VideoQualityEnum.P1080,
                VideoQualityEnum.P1440,
                VideoQualityEnum.P4K,
                VideoQualityEnum.P8K,
                VideoQualityEnum.ORIGINAL,
            ],
        }),
    );
}
