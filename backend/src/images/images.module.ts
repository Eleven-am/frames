import { Module } from '@nestjs/common';

import { ImagesService } from './images.service';
import { FanArtAPIKeyProvider } from '../config/fanArtProvider';


@Module({
    providers: [FanArtAPIKeyProvider, ImagesService],
    exports: [ImagesService],
})
export class ImagesModule {}
