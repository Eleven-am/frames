import { join } from 'path';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';

async function bootstrap () {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    const config = new DocumentBuilder()
        .setTitle('Frames API')
        .setDescription(
            'This is the API documentation for the Frames application. Frames is a VOD streaming service that allows users to watch movies and TV shows. This API documentation provides a detailed overview of the available endpoints and their functionality. It also includes information about the request and response formats, as well as the available query parameters and request headers. This documentation is intended for developers who want to integrate with the Frames API and build custom applications on top of it. If you have any questions or need further assistance, please contact our support team.',
        )
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);

    app.use(cookieParser());
    app.setBaseViewsDir(join(__dirname, '..', 'views'));
    app.useStaticAssets(join(__dirname, '..', 'public'));
    app.setViewEngine('ejs');
    app.use(json({ limit: '50mb' }));

    app.use(urlencoded({
        extended: true,
        limit: '50mb',
    }));

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
        }),
    );

    SwaggerModule.setup('/swagger', app, document);

    if (process.env.NODE_ENV === 'development') {
        app.enableCors({
            origin: '*',
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            preflightContinue: false,
            optionsSuccessStatus: 204,
            credentials: true,
        });
    } else {
        app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
    }

    await app.listen(3000);
}

bootstrap()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
