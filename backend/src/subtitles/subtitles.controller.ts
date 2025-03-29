import { CanPerform, Action } from '@eleven-am/authorizer';
import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Subtitle } from '@prisma/client';


import { UpdateOffsetSchema, SubtitleInfoSchema } from './subtitles.contracts';
import { ApiSubtitleId, CurrentSubtitle } from './subtitles.decorators';
import { SubtitlesService } from './subtitles.service';

@ApiTags('Subtitles')
@Controller('subtitle')
export class SubtitlesController {
    constructor (private readonly subtitleService: SubtitlesService) {}

    @Get(':subtitleId')
    @ApiSubtitleId('to retrieve')
    @CanPerform({
        action: Action.Read,
        resource: 'Subtitle',
    })
    @ApiOperation({
        summary: 'Get a subtitle',
        description: 'Get the requested subtitle based on the subtitle ID',
    })
    @ApiOkResponse({
        description: 'The requested subtitle',
        type: SubtitleInfoSchema,
    })
    getSubtitles (@CurrentSubtitle() subtitle: Subtitle) {
        return this.subtitleService.getSubtitles(subtitle);
    }

    @Patch(':subtitleId')
    @ApiSubtitleId('to update')
    @CanPerform({
        action: Action.Update,
        resource: 'Subtitle',
    })
    @ApiOperation({
        summary: 'Update the subtitle offset',
        description: 'Update the subtitle offset for the requested subtitle',
    })
    @ApiOkResponse({
        description: 'The updated subtitle',
        type: SubtitleInfoSchema,
    })
    updateOffset (@CurrentSubtitle() subtitle: Subtitle, @Body() body: UpdateOffsetSchema) {
        return this.subtitleService.updateOffset(subtitle, body.offset);
    }
}
