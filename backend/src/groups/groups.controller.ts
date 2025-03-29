import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateGroupArgs } from './groups.contracts';
import { GroupsService } from './groups.service';
import { CurrentSession } from '../authorisation/auth.decorators';
import { CachedSession } from '../session/session.contracts';


@Controller('groups')
@ApiTags('Groups')
export class GroupsController {
    constructor (private readonly groupsService: GroupsService) {}

    @Post()
    create (@Body() params: CreateGroupArgs, @CurrentSession.HTTP() { user }: CachedSession) {
        return this.groupsService.create(params, user);
    }

    @Get()
    findAll () {
        return this.groupsService.findAll();
    }

    @Delete(':id')
    remove (@Param('id') id: string) {
        return this.groupsService.remove(Number(id));
    }
}
