import { Module } from '@nestjs/common';

import { SocketEndpoint } from './socket.endpoint';


@Module({
    providers: [SocketEndpoint],
})
export class SocketModule {}
