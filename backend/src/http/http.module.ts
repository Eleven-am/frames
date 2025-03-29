import { HttpModule as BaseHttpModule } from '@nestjs/axios';
import { Module, Global } from '@nestjs/common';

import { HttpService } from './http.service';

@Global()
@Module({
    imports: [BaseHttpModule],
    providers: [HttpService],
    exports: [HttpService],
})
export class HttpModule {}
