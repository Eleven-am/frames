import { CanPerform, Action } from '@eleven-am/authorizer';
import { Controller, Post, Body, Get, Query, Patch, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';

import {
    CreateOauthClientArgs,
    OauthClientSchema,
    UpdateOauthClientArgs,
    PageResponseOauthClientSchema,
} from './oauth.schema';
import { OauthService } from './oauth.service';
import { PaginateArgs } from '../utils/utils.contracts';
import { ApiOkFramesResponse, ApiUnauthorizedException } from '../utils/utils.decorators';


@Controller('oauth')
@ApiTags('Oauth')
export class OauthController {
    constructor (
        private readonly oauthService: OauthService,
    ) {}

    @Post()
    @ApiOperation({
        summary: 'Create an oauth client',
        description: 'Create an oauth client',
    })
    @CanPerform({
        action: Action.Create,
        resource: 'Oauth',
    })
    @ApiCreatedResponse({
        description: 'The OAUTH client has been successfully created',
        type: OauthClientSchema,
    })
    createOauth (@Body() body: CreateOauthClientArgs) {
        return this.oauthService.create(body);
    }

    @Get()
    @ApiOperation({
        summary: 'Get all OAUTH clients',
        description: 'Get all OAUTH clients the current user has access to',
    })
    @ApiOkResponse({
        description: 'The OAUTH clients have been successfully fetched',
        type: PageResponseOauthClientSchema,
    })
    @ApiUnauthorizedException('Unauthorized')
    findAll (@Query() paginated: PaginateArgs) {
        return this.oauthService.findAll(paginated);
    }

    @Get(':oauthId')
    @CanPerform({
        action: Action.Read,
        resource: 'Oauth',
    })
    @ApiOperation({
        summary: 'Get an OAUTH client by ID',
        description: 'Get an OAUTH client by ID',
    })
    @ApiOkResponse({
        description: 'The OAUTH client has been successfully fetched',
        type: OauthClientSchema,
    })
    findOne (@Param('oauthId') id: string) {
        return this.oauthService.findOne(id);
    }

    @Patch(':oauthId')
    @CanPerform({
        action: Action.Update,
        resource: 'Oauth',
    })
    @ApiOperation({
        summary: 'Update an oauth client',
        description: 'Update an oauth client',
    })
    @ApiOkResponse({
        description: 'The OAUTH client has been successfully updated',
        type: OauthClientSchema,
    })
    updateOauth (@Param('oauthId') id: string, @Body() body: UpdateOauthClientArgs) {
        return this.oauthService.update(id, body);
    }

    @Delete(':oauthId')
    @CanPerform({
        action: Action.Delete,
        resource: 'Oauth',
    })
    @ApiOperation({
        summary: 'Delete an oauth client',
        description: 'Delete an oauth client',
    })
    @ApiOkFramesResponse('The OAUTH client has been successfully deleted')
    deleteOauth (@Param('oauthId') id: string) {
        return this.oauthService.remove(id);
    }
}
