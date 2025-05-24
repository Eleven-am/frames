import { createInternalError, Either, TaskEither } from "@eleven-am/fp";
import { Provider } from "@eleven-am/nestjs-storage";
import { StorageService as BaseStorageService } from "@eleven-am/nestjs-storage/dist/service/storage.service";
import {
	DropboxStorageOption,
	GDriveStorageOption,
	S3StorageOption,
} from "@eleven-am/nestjs-storage/dist/types/options";
import { LocalStorageOption } from "@eleven-am/nestjs-storage/src/types/options";
import { Injectable } from "@nestjs/common";
import {
	CloudDrive,
	CloudStorage,
	Folder,
	Media,
	MediaType,
	User,
	Video,
} from "@prisma/client";

import {
	CreateStorageArgs,
	storageCredentialsSchema,
	UpdateStorageArgs,
} from "./storage.args";
import { FramesFile, RecursiveFramesFile, SafeStorage } from "./storage.schema";
import { PrismaService } from "../prisma/prisma.service";
import { mapPageResponse } from "../utils/helper.fp";
import { PaginateArgs } from "../utils/utils.contracts";
import { IFileWithParentName } from "@eleven-am/nestjs-storage/src/types/storage";

@Injectable()
export class StorageService {
	constructor(
		private readonly prismaService: PrismaService,
		public readonly baseStorageService: BaseStorageService,
	) {}
	
	getObjectFromMedia(media: Media) {
		return TaskEither.tryCatch(
			() =>
				this.prismaService.media.findUnique({
					where: {
						id: media.id,
					},
					include: {
						videos: true,
						folder: true,
					},
				}),
			"Failed to find media",
		)
			.nonNullable("Media not found")
			.filter(
				(media) =>
					(media.type === MediaType.SHOW && media.folder !== null) ||
					(media.type === MediaType.MOVIE && media.videos.length === 1),
				() => createInternalError("Media structure is invalid"),
			)
			.map((media) => ({
				storageId:
					media.folder?.cloudStorageId || media.videos[0].cloudStorageId,
				location: media.folder?.location || media.videos[0].location,
			}))
			.chain((location) => this.getFile(location.storageId, location.location));
	}
	
	getObjectFromFolder(folder: Folder) {
		return this.getFile(folder.cloudStorageId, folder.location);
	}
	
	getObjectFromVideo(video: Video) {
		return this.getFile(video.cloudStorageId, video.location);
	}
	
	getStreamDataFromVideo(video: Video, range: string) {
		const defaultRange = "bytes=0-";
		const newRange = range || defaultRange;
		
		return this.performActionById(video.cloudStorageId, (provider) =>
			provider.streamFile(video.location, newRange),
		);
	}
	
	getContents(cloudStorage: CloudStorage, folder?: string) {
		return this.performAction(cloudStorage, (provider) =>
			provider.readFolder(folder),
		).map((items) =>
			items.map(
				(item): FramesFile => ({
					...item,
					cloudStorageId: cloudStorage.id,
				}),
			),
		);
	}
	
	readFolder(cloudStorageId: string, path?: string) {
		return this.performActionById(cloudStorageId, (provider) =>
			provider.readFolder(path),
		).map((items) =>
			items.map(
				(item): FramesFile => ({
					...item,
					cloudStorageId,
				}),
			),
		);
	}
	
	getRecursiveContents(
		cloudStorage: CloudStorage,
		folder: string,
	): TaskEither<RecursiveFramesFile[]> {
		return this.performAction(
			cloudStorage,
			(provider): Promise<IFileWithParentName[]> => provider.readFolderRecursive(folder),
		).map((items) =>
			items.map(
				(item): RecursiveFramesFile => ({
					...item,
					cloudStorageId: cloudStorage.id,
				}),
			),
		);
	}
	
	create(user: User, createStorageDto: CreateStorageArgs) {
		return Either
			.tryCatch(
				() => JSON.parse(createStorageDto.credentials),
				"Invalid credentials",
			)
			.parseSchema(storageCredentialsSchema)
			.toTaskEither()
			.map(
				(
					credentials,
				): Omit<
					CloudStorage,
					"id" | "updated" | "modify" | "created" | "userId"
				> => ({
					...createStorageDto,
					credentials,
				}),
			)
			.chain(this.testConnection.bind(this))
			.chain(() =>
				TaskEither.tryCatch(
					() =>
						this.prismaService.cloudStorage.create({
							data: {
								...createStorageDto,
								user: {
									connect: {
										id: user.id,
									},
								},
							},
							include: { user: true },
						}),
					"Failed to create storage",
				),
			)
			.map((storage) => this.mapStorage(storage));
	}
	
	findAll(paginatedArgs: PaginateArgs) {
		return TaskEither.tryCatch(
			() => this.prismaService.cloudStorage.paginate({
				paginate: paginatedArgs,
				include: { user: true },
			}),
			"Failed to retrieve storage",
		).map(mapPageResponse((storage) => this.mapStorage(storage)));
	}
	
	update(storage: CloudStorage, updateStorageDto: UpdateStorageArgs) {
		const newStorage: CloudStorage = {
			...storage,
			movieLocations: updateStorageDto.movieLocations,
			showLocations: updateStorageDto.showLocations,
		};
		
		return this.testConnection(newStorage)
			.chain(() =>
				TaskEither.tryCatch(
					() =>
						this.prismaService.cloudStorage.update({
							where: { id: storage.id },
							data: updateStorageDto,
							include: { user: true },
						}),
					"Failed to update storage",
				),
			)
			.map((storage) => this.mapStorage(storage));
	}
	
	remove(storage: CloudStorage) {
		return TaskEither.tryCatch(
			() =>
				this.prismaService.cloudStorage.delete({
					where: { id: storage.id },
					include: { user: true },
				}),
			"Failed to delete storage",
		).map(() => ({
			message: "Storage deleted successfully",
		}));
	}
	
	getFile(cloudStorageId: string, location: string) {
		return this.performActionById(cloudStorageId, (provider) =>
			provider.getFileOrFolder(location),
		)
			.nonNullable("File not found")
			.map(
				(file): FramesFile => ({
					...file,
					cloudStorageId,
				}),
			);
	}
	
	deleteFileOrFolder(cloudStorageId: string, location: string) {
		return this.performActionById(cloudStorageId, (provider) =>
			provider.deleteFileOrFolder(location),
		);
	}
	
	private getStorageFromId(cloudStorageId: string) {
		return TaskEither.tryCatch(
			() =>
				this.prismaService.cloudStorage.findUnique({
					where: { id: cloudStorageId },
				}),
			"Failed to retrieve cloud storage",
		)
			.nonNullable("Cloud storage not found")
			.chain(this.getStorage.bind(this));
	}
	
	private getStorage(cloudStorage: CloudStorage) {
		const getLocal = (cloudStorage: CloudStorage) =>
			this.baseStorageService.createProvider({
				provider: Provider.LOCAL,
				options: cloudStorage.credentials as LocalStorageOption["options"],
			});
		
		const getS3 = (cloudStorage: CloudStorage) =>
			this.baseStorageService.createProvider({
				provider: Provider.S3,
				options: cloudStorage.credentials as S3StorageOption["options"],
			});
		
		const dropbox = (cloudStorage: CloudStorage) =>
			this.baseStorageService.createProvider({
				provider: Provider.DROPBOX,
				options: cloudStorage.credentials as DropboxStorageOption["options"],
			});
		
		const googleDrive = (cloudStorage: CloudStorage) =>
			this.baseStorageService.createProvider({
				provider: Provider.GDRIVE,
				options: cloudStorage.credentials as GDriveStorageOption["options"],
			});
		
		return Either.of(cloudStorage)
			.match([
				{
					predicate: (cloudStorage) =>
						typeof cloudStorage.credentials === "string",
					run: () => {
						cloudStorage.credentials = JSON.parse(
							cloudStorage.credentials as string,
						);
						
						return cloudStorage;
					},
				},
				{
					predicate: (cloudStorage) =>
						typeof cloudStorage.credentials === "object",
					run: (cloudStorage) => cloudStorage,
				},
			])
			.match([
				{
					predicate: (cloudStorage) => cloudStorage.drive === CloudDrive.LOCAL,
					run: getLocal,
				},
				{
					predicate: (cloudStorage) => cloudStorage.drive === CloudDrive.S3,
					run: getS3,
				},
				{
					predicate: (cloudStorage) =>
						cloudStorage.drive === CloudDrive.DROPBOX,
					run: dropbox,
				},
				{
					predicate: (cloudStorage) => cloudStorage.drive === CloudDrive.GDRIVE,
					run: googleDrive,
				},
			])
			.map((provider) => ({
				provider,
				cloudStorage,
			}))
			.toTaskEither();
	}
	
	private testConnection(cloudStorage: CloudStorage) {
		return this.performAction(cloudStorage, (provider) =>
			provider.getFileOrFolder(cloudStorage.movieLocations[0]),
		);
	}
	
	private performActionById<ReturnType>(
		cloudStorageId: string,
		action: (storageService: BaseStorageService) => Promise<ReturnType>,
	) {
		return this.getStorageFromId(cloudStorageId).fromPromise(({ provider }) =>
			action(provider),
		);
	}
	
	private performAction<ReturnType>(
		cloudStorage: CloudStorage,
		action: (storageService: BaseStorageService) => Promise<ReturnType>,
	) {
		return this.getStorage(cloudStorage).fromPromise(({ provider }) =>
			action(provider),
		);
	}
	
	private mapStorage(cloudStorage: CloudStorage): SafeStorage {
		return cloudStorage;
	}
}
