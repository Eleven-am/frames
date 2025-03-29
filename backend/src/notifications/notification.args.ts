import { Type } from 'class-transformer';
import { IsObject, ValidateNested } from 'class-validator';

import { MetadataSchema } from '../socket/socket.schema';

export class PresenceChangeSchema {
    @IsObject()
    @ValidateNested()
    @Type(() => MetadataSchema)
    metadata: MetadataSchema | null;
}
