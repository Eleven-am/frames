import { Either, TaskEither } from '@eleven-am/fp';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '../http/http.service';
import { DOCKER_IMAGE_ARCH, DOCKER_IMAGE_NAME, DOCKER_IMAGE_PREFIXES, DOCKER_IMAGE_TIMESTAMP } from './health.constants';
import { DockerTag, RepoName, dockerResultsSchema, VersionInfo } from './health.contracts';

@Injectable()
export class DockerVersionService {
    private static readonly baseUrl = 'https://hub.docker.com/v2/repositories';
    private readonly imageName: string;
    private readonly possibleTags: string[];
    private readonly prefixesWithArch: string[];

    constructor (private readonly httpService: HttpService, configService: ConfigService) {
        this.imageName = configService.getOrThrow<string>(DOCKER_IMAGE_NAME);
        const timestamp = configService.getOrThrow<string>(DOCKER_IMAGE_TIMESTAMP);
        const arch = configService.getOrThrow<string>(DOCKER_IMAGE_ARCH);
        let prefixes = configService.getOrThrow<string>(DOCKER_IMAGE_PREFIXES)
            .split(' ').filter((p) => p.trim() !== '');

        prefixes = prefixes.length ? prefixes : ['latest'];
        this.prefixesWithArch = prefixes.map((prefix) => `${prefix}-${arch}`);
        this.possibleTags = prefixes.map((prefix) => `${prefix}-${timestamp}-${arch}`);
    }

    /**
     * @desc Check if the docker image is up to date
     */
    isUpToDate () {
        const getCurrentTag = (tags: DockerTag[]) => {
            const latestTag = tags.find((tag) => this.prefixesWithArch.includes(tag.name));
            const currentTag= tags.find((tag) => this.possibleTags.includes(tag.name));

            return TaskEither
                .fromBind({
                    currentTag: TaskEither.fromNullable(currentTag),
                    latestTag: TaskEither.fromNullable(latestTag),
                })
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
                isLatest: currentTag.digest === latestTag.digest,
                latestCreated: latestTag.last_updated,
                currentVersion: currentTag.name,
                latestVersion: latestTag.name,
                checkedAt: new Date(),
            }))
    }
}
