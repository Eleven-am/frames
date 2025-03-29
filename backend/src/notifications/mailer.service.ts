import { TaskEither, createInternalError } from '@eleven-am/fp';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import * as nodemailer from 'nodemailer';
import { NODEMAILER_CONFIG_UPDATED_EVENT } from '../misc/misc.constants';
import { NodemailerConfigEvent } from '../misc/misc.schema';
import { RetrieveService } from '../misc/retrieve.service';
import { SendMailParams } from './notification.schema';

@Injectable()
export class MailerService implements OnModuleInit {
    private transport: nodemailer.Transporter | null = null;
    private domain: string | null = null;

    constructor (
        private readonly retrieveService: RetrieveService,
    ) {}

    async onModuleInit () {
        const response = await this.retrieveService.mailConfig
            .map((options) => ({
                transport: nodemailer.createTransport(options.config),
                domain: options.domain,
            }))
            .toNullable();

        if (response === null) {
            return;
        }

        this.transport = response.transport;
        this.domain = response.domain;
    }

    /**
     * Sends an email
     * @param mail - The mail to send
     */
    sendMail (mail: SendMailParams) {
        return TaskEither
            .fromBind({
                domain: TaskEither.fromNullable(this.domain),
                transport: TaskEither.fromNullable(this.transport),
            })
            .chain(({ domain, transport }) => TaskEither
                .tryCatch(
                    () => transport.sendMail({
                        ...mail,
                        from: `Frames <no-reply@${domain}>`,
                    }),
                    'Failed to send mail',
                ),
            )
            .map((mail) => mail.messageId)
            .filter(
                (messageId) => messageId !== undefined,
                () => createInternalError('Failed to send mail'),
            );
    }

    @OnEvent(NODEMAILER_CONFIG_UPDATED_EVENT)
    private onNodeMailerConfigUpdated (event: NodemailerConfigEvent) {
        this.transport = nodemailer.createTransport(event.config);
        this.domain = event.domain;
    }
}
