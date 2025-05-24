import { IsEnum, IsNumber } from "class-validator";
import { AudioQualityEnum, VideoQualityEnum } from "@eleven-am/transcoder/types";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class AudiOptions {
	@IsEnum([AudioQualityEnum.AAC, AudioQualityEnum.ORIGINAL])
	quality: AudioQualityEnum;
	
	@IsNumber()
	@Type(() => Number)
	streamIndex: number;
}

export class VideoOptions {
	@IsEnum([
		VideoQualityEnum.P240,
		VideoQualityEnum.P360,
		VideoQualityEnum.P480,
		VideoQualityEnum.P720,
		VideoQualityEnum.P1080,
		VideoQualityEnum.P1440,
		VideoQualityEnum.P4K,
		VideoQualityEnum.P8K,
		VideoQualityEnum.ORIGINAL,
	])
	quality: VideoQualityEnum;
	
	@IsNumber()
	@Type(() => Number)
	streamIndex: number;
}

export class VideoOptionWithSegment extends VideoOptions {
	@IsNumber()
	@Type(() => Number)
	segment: number;
}

export class AudioOptionWithSegment extends AudiOptions {
	@IsNumber()
	@Type(() => Number)
	segment: number;
}

export class ScreenShotOptions extends VideoOptions {
	@IsNumber()
	@Type(() => Number)
	timestamp: number;
}

export class HLSSubtitleInfoSchema {
	@ApiProperty({
		description: 'Index of the subtitle track',
		type: Number,
	})
	index: number;
	
	@ApiProperty({
		description: 'Language of the subtitle track',
		type: String,
	})
	language: string;
	
	@ApiProperty({
		description: 'URL of the subtitle track',
		type: String,
	})
	url: string;
}
