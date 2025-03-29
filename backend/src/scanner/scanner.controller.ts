import { CanPerform, Action } from '@eleven-am/authorizer';
import { Body, Controller, Get, Patch, Query, Delete, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CloudStorage, Media } from '@prisma/client';

import {
    EditMediaSchema,
    EpisodeFileSchema,
    FrontImagesSchema,
    GetImagesSchema,
    GetMediaSchema,
    TmdbMediaSchema,
    StorageDetailSchema,
    CreateMediaArgs,
    PageResponseUnScannedItemSchema,
    UnScannedArgs,
    CreateFromTmdbIdArgs,
} from './scanner.contracts';
import { ScannerService } from './scanner.service';
import { ApiMediaId, CurrentMedia } from '../media/media.decorators';
import { ApiStorageId, CurrentStorage } from '../storage/storage.decorators';
import { ApiOkFramesResponse, ApiCreatedFramesResponse } from '../utils/utils.decorators';


@Controller('scan')
@ApiTags('Scan')
export class ScannerController {
    constructor (private readonly scannerService: ScannerService) {}

    @Get()
    @CanPerform({
        action: Action.Read,
        resource: 'CloudStorage',
    })
    @ApiOperation({
        summary: 'Scan all server storages',
        description: 'Scan all the server storages for new shows and movies',
    })
    @ApiOkFramesResponse('Successfully scanned server')
    scanServer () {
        return this.scannerService.requestServerScan();
    }

    @Get('storages')
    @CanPerform({
        action: Action.Read,
        resource: 'CloudStorage',
    })
    @ApiOperation({
        summary: 'Retrieve all server storages',
        description: 'Retrieve all the server storages for viewing',
    })
    @ApiOkResponse({
        description: 'Successfully retrieved server storages',
        type: [StorageDetailSchema],
    })
    getStorages () {
        return this.scannerService.getStorages();
    }

    @Get('un-scanned')
    @CanPerform({
        action: Action.Read,
        resource: 'CloudStorage',
    })
    @ApiOperation({
        summary: 'Retrieve the un-scanned media',
        description: 'Retrieve all the un-scanned media from all the server storages',
    })
    @ApiOkResponse({
        description: 'Successfully retrieved un-scanned media',
        type: PageResponseUnScannedItemSchema,
    })
    getUnScannedItems (@Query() query: UnScannedArgs) {
        return this.scannerService.getUnScannedItems(query);
    }

    @Get('storage/:storageId')
    @CanPerform({
        action: Action.Read,
        resource: 'CloudStorage',
    })
    @ApiStorageId('to scan')
    @ApiOperation({
        summary: 'Scan media on a storage',
        description: 'Scan the given storage for new shows and movies',
    })
    @ApiOkFramesResponse('Successfully scanned storage')
    scanStorage (@CurrentStorage() storage: CloudStorage) {
        return this.scannerService.requestLibraryScan(storage);
    }

    @Get('shows/:storageId')
    @CanPerform({
        action: Action.Read,
        resource: 'CloudStorage',
    })
    @ApiStorageId('to scan shows from')
    @ApiOperation({
        summary: 'Scan shows on a storage',
        description: 'Scan the given storage for new shows',
    })
    @ApiOkFramesResponse('Successfully scanned shows')
    scanShows (@CurrentStorage() storage: CloudStorage) {
        return this.scannerService.requestShowsScan(storage);
    }

    @Get('movies/:storageId')
    @CanPerform({
        action: Action.Read,
        resource: 'CloudStorage',
    })
    @ApiStorageId('to scan movies from')
    @ApiOperation({
        summary: 'Scan movies on a storage',
        description: 'Scan the given storage for new movies',
    })
    @ApiOkFramesResponse('Successfully scanned movies')
    scanMovies (@CurrentStorage() storage: CloudStorage) {
        return this.scannerService.requestMoviesScan(storage);
    }

    @Get('show/:mediaId')
    @CanPerform({
        action: Action.Read,
        resource: 'CloudStorage',
    })
    @ApiMediaId('to scan episodes from')
    @ApiOperation({
        summary: 'Scan show for new episodes',
        description: 'Scan the given show for new episodes',
    })
    @ApiOkFramesResponse('Successfully scanned show')
    scanEpisodesInShow (@CurrentMedia() media: Media) {
        return this.scannerService.requestEpisodesInShowScan(media);
    }

    @Get('media/:mediaId')
    @CanPerform(
        {
            action: Action.Update,
            resource: 'Media',
        },
        {
            action: Action.Read,
            resource: 'Media',
        },
    )
    @ApiMediaId('to modify')
    @ApiOperation({
        summary: 'Retrieve media information',
        description: 'Retrieve the information for the given media to be used for editing the media',
    })
    @ApiOkResponse({
        description: 'Successfully retrieved media information',
        type: GetMediaSchema,
    })
    getMediaForEdit (@CurrentMedia() media: Media) {
        return this.scannerService.getMediaForEdit(media);
    }

    @Get('episodes/:mediaId')
    @CanPerform(
        {
            action: Action.Update,
            resource: 'Media',
        },
        {
            action: Action.Read,
            resource: 'Media',
        },
    )
    @ApiMediaId('to retrieve episodes for')
    @ApiOperation({
        summary: 'Retrieve episodes for media',
        description: 'Retrieve the episodes for the given media',
    })
    @ApiOkResponse({
        description: 'Successfully retrieved media episodes',
        type: [EpisodeFileSchema],
    })
    getMediaEpisodes (@CurrentMedia() media: Media) {
        return this.scannerService.getEpisodesForEdit(media);
    }

    @Get('images')
    @CanPerform(
        {
            action: Action.Update,
            resource: 'Media',
        },
        {
            action: Action.Read,
            resource: 'Media',
        },
    )
    @ApiOperation({
        summary: 'Retrieve images using the tmdbId',
        description: 'Retrieve the images for the given media using the tmdbId',
    })
    @ApiOkResponse({
        description: 'Successfully retrieved media images',
        type: FrontImagesSchema,
    })
    getMediaImages (@Query() query: GetImagesSchema) {
        return this.scannerService.getMediaImages(query);
    }

    @Get('tmdbId')
    @CanPerform(
        {
            action: Action.Update,
            resource: 'Media',
        },
        {
            action: Action.Read,
            resource: 'Media',
        },
    )
    @ApiOperation({
        summary: 'Retrieve media information using the tmdbId',
        description: 'Retrieve the information for the given media using the tmdbId',
    })
    @ApiOkResponse({
        description: 'Successfully retrieved media information',
        type: TmdbMediaSchema,
    })
    getMediaFromTmdbId (@Query() query: GetImagesSchema) {
        return this.scannerService.getMediaFromTmdbId(query);
    }

    @Post('tmdbId/:storageId')
    @CanPerform(
        {
            action: Action.Update,
            resource: 'Media',
        },
        {
            action: Action.Update,
            resource: 'CloudStorage',
        },
    )
    @ApiOperation({
        summary: 'Create a new media using the tmdbId',
        description: 'Create a new media with the given information using the tmdbId',
    })
    @ApiCreatedFramesResponse('Successfully created media')
    createFromTmdbId (@Body() query: CreateFromTmdbIdArgs) {
        return this.scannerService.createFromTmdbId(query);
    }

    @Patch('media/:mediaId')
    @CanPerform(
        {
            action: Action.Update,
            resource: 'Media',
        },
        {
            action: Action.Read,
            resource: 'Media',
        },
    )
    @ApiMediaId('to modify')
    @ApiOperation({
        summary: 'Updates media information',
        description: 'Updates the information for the given media to be used for editing the media',
    })
    @ApiOkResponse({
        description: 'Successfully updated media information',
        type: GetMediaSchema,
    })
    updateMedia (@CurrentMedia() media: Media, @Body() body: EditMediaSchema) {
        return this.scannerService.updateMedia(media, body);
    }

    @Delete('media/:mediaId')
    @CanPerform(
        {
            action: Action.Delete,
            resource: 'Media',
        },
        {
            action: Action.Read,
            resource: 'Media',
        },
    )
    @ApiMediaId('to delete')
    @ApiOperation({
        summary: 'Delete media',
        description: 'Delete the given media. NOTE THIS WILL DELETE THE UNDERLYING FILES',
    })
    @ApiOkFramesResponse('Successfully deleted media')
    deleteMedia (@CurrentMedia() media: Media) {
        return this.scannerService.deleteMedia(media);
    }

    @Post('media/:storageId')
    @CanPerform(
        {
            action: Action.Update,
            resource: 'Media',
        },
        {
            action: Action.Update,
            resource: 'CloudStorage',
        },
    )
    @ApiOperation({
        summary: 'Create a new media',
        description: 'Create a new media with the given information',
    })
    @ApiCreatedFramesResponse('Successfully created media')
    createMedia (@Body() body: CreateMediaArgs) {
        return this.scannerService.createNewMedia(body);
    }
}
