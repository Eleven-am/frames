import { Controller, Get, Param, Render } from '@nestjs/common';
import { ApiParam, ApiProduces, ApiTags } from '@nestjs/swagger';

import { RenderService } from './render.service';


@Controller('/')
@ApiTags('Render')
export class RenderController {
    constructor (private readonly renderService: RenderService) {}

    @Get('m=:name')
    @ApiParam({
        name: 'name',
        type: String,
        description: 'Name of the movie to render',
    })
    @Render('index')
    @ApiProduces('text/html')
    getMovieByName (@Param('name') name: string) {
        return this.renderService.getMovieByName(name);
    }

    @Get('s=:name')
    @ApiParam({
        name: 'name',
        type: String,
        description: 'Name of the show to render',
    })
    @Render('index')
    @ApiProduces('text/html')
    getShowByName (@Param('name') name: string) {
        return this.renderService.getShowByName(name);
    }

    @Get('p=:name')
    @ApiParam({
        name: 'name',
        type: String,
        description: 'Name of the person to render',
    })
    @Render('index')
    @ApiProduces('text/html')
    getPersonByName (@Param('name') name: string) {
        return this.renderService.getPersonByName(name);
    }

    @Get('c=:name')
    @ApiParam({
        name: 'name',
        type: String,
        description: 'Name of the company to render',
    })
    @Render('index')
    @ApiProduces('text/html')
    getCompanyByName (@Param('name') name: string) {
        return this.renderService.getCompanyByName(name);
    }

    @Get('r=:roomId')
    @ApiParam({
        name: 'roomId',
        type: String,
        description: 'Id of the room to render',
    })
    @Render('index')
    @ApiProduces('text/html')
    getRoomById (@Param('roomId') roomId: string) {
        return this.renderService.getRoomById(roomId);
    }

    @Get('f=:cypher')
    @ApiParam({
        name: 'cypher',
        type: String,
        description: 'Cypher of frame to render',
    })
    @Render('index')
    @ApiProduces('text/html')
    getFrameByCypher (@Param('cypher') cypher: string) {
        return this.renderService.getFrameByCypher(cypher);
    }

    @Get('w=:playbackId')
    @ApiParam({
        name: 'playbackId',
        type: String,
        description: 'Id of the playback to render',
    })
    @Render('index')
    @ApiProduces('text/html')
    getPlaybackById (@Param('playbackId') playbackId: string) {
        return this.renderService.getPlaybackById(playbackId);
    }

    @Get('col=:name')
    @ApiParam({
        name: 'name',
        type: String,
        description: 'Name of the collection to render',
    })
    @Render('index')
    @ApiProduces('text/html')
    getCollectionByName (@Param('name') name: string) {
        return this.renderService.getCollectionByName(name);
    }

    @Get('pl=:playlistId')
    @ApiParam({
        name: 'playlistId',
        type: String,
        description: 'Id of the playlist to render',
    })
    @Render('index')
    @ApiProduces('text/html')
    getPlaylistById (@Param('playlistId') playlistId: string) {
        return this.renderService.getPlaylistById(playlistId);
    }

    @Get('setup')
    @Render('index')
    @ApiProduces('text/html')
    toSetup () {
        return this.renderService.loadSetup();
    }

    @Get('*route')
    @Render('index')
    @ApiProduces('text/html')
    wildCard () {
        return this.renderService.getDefaults();
    }

    @Get()
    @Render('index')
    @ApiProduces('text/html')
    default () {
        return this.renderService.getDefaults();
    }
}
