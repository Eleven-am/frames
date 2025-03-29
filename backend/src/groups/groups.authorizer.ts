import { WillAuthorize, Authorizer, RuleBuilder } from '@eleven-am/authorizer';
import { User } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';


@Authorizer()
export class GroupsAuthorizer implements WillAuthorize {
    constructor (private readonly prismaService: PrismaService) {}

    forUser (user: User, builder: RuleBuilder) {}
}
