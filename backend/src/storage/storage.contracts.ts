import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DeleteFileArgs {
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
