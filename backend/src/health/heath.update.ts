import { Either, TaskEither } from '@eleven-am/fp';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '../http/http.service';
import { DOCKER_IMAGE_NAME, DOCKER_IMAGE_TAG } from './health.constants';
import { DockerTag, RepoName, dockerResultsSchema, VersionInfo } from './health.contracts';

@Injectable()
export class DockerVersionService {
    private static readonly baseUrl = 'https://hub.docker.com/v2/repositories';
    private readonly imageName: string;
    private readonly currentTag: string;

    constructor (private readonly httpService: HttpService, configService: ConfigService) {
        this.imageName = configService.getOrThrow<string>(DOCKER_IMAGE_NAME);
        this.currentTag = configService.getOrThrow<string>(DOCKER_IMAGE_TAG);
    }

    /**
     * @desc Check if the docker image is up to date
     */
    isUpToDate () {
        const getCurrentTag = (tags: DockerTag[]) => {
            const tag = tags.find(tag => tag.name === this.currentTag);
            return TaskEither
                .fromNullable(tag)
                .map((tag) => ({
                    currentTag: tag,
                    latestTag: tags[0],
                }))
        }

        return Either
            .of(this.imageName)
            .match([
                {
                    predicate: (imageName) => imageName.includes('/'),
                    run: (imageName) => imageName.split('/', 2) as RepoName,
                },
                {
                    predicate: () => true,
                    run: (imageName): RepoName => ['library', imageName],
                }
            ])
            .map(([repository, name]) => `${DockerVersionService.baseUrl}/${repository}/${name}/tags`)
            .toTaskEither()
            .chain((url) => this.httpService.getSafe(url, dockerResultsSchema))
            .map(({ results }) => results)
            .filterItems((tag) => tag.name !== 'latest')
            .mapItems((tag) => ({
                ...tag,
                last_updated: new Date(tag.last_updated),
            }))
            .sortBy('last_updated', 'desc')
            .chain(getCurrentTag)
            .map(({ currentTag, latestTag }): VersionInfo => ({
                isLatest: currentTag.name === latestTag.name,
                latestCreated: latestTag.last_updated,
                currentVersion: currentTag.name,
                latestVersion: latestTag.name,
                checkedAt: new Date(),
            }))
    }
}
