import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

import { CreateGroupArgs } from './groups.contracts';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class GroupsService {
    constructor (private readonly prisma: PrismaService) {}

    create (params: CreateGroupArgs, user: User) {
    }

    findAll () {
    }

    findOne (sessionUser: User) {
    }

    remove (id: number) {
    }
}
