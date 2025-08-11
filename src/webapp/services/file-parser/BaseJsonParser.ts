import { FILE_MAPPER, FileParser, FILES_FOLDER, getFilesWithMapping, jsonToBlob } from "./FileParser";
import { FileEntry } from "./models/FileEntry";
import { Future, FutureData } from "../../../domain/types/Future";
import { FileMap, FileMapModel } from "./models/FileMap";
import { fromPairs, Maybe } from "../../../types/utils";
import { promiseMap } from "../../../utils/promises";
import _ from "lodash";
import { getUrls, replaceUrls } from "../../../utils/urls";
import { TranslatableText } from "../../../domain/entities/TranslatableText";
import { Either } from "../../../domain/types/Either";
import type { Codec } from "purify-ts";

type NamedEntity = {
    name: TranslatableText;
};

export abstract class BaseJsonParser<TEntity extends NamedEntity, TJson> implements FileParser<TEntity> {
    prefix: string;

    protected abstract jsonModelToEntityModel(jsonModel?: TJson): Maybe<TEntity>;
    protected abstract domainEntityToJsonModel(entity: TEntity): TJson;

    protected constructor(
        protected baseUrl: string,
        protected uploadFile: (data: ArrayBuffer, name: string) => Promise<string>,
        prefix: string,
        private readonly codec: Codec<TJson>
    ) {
        this.prefix = prefix;
    }

    fromEntries(files: FileEntry[]): FutureData<TEntity[]> {
        const rawFileMapper = files.find(file => file.fileName === FILE_MAPPER);

        if (!rawFileMapper) {
            return Future.error(`File mapper ${FILE_MAPPER} not found in the provided files.`);
        } else {
            return this.parseFileMapper(rawFileMapper)
                .flatMap(fileMap => {
                    const filesToUpload = files.filter(file => file.folderPath === FILES_FOLDER);
                    return this.uploadAndGetOldNewUrlMapping(filesToUpload, fileMap);
                })
                .flatMap(oldNewUrlMapping => {
                    const blobs = files
                        .filter(file => file.folderPath !== FILES_FOLDER && file.fileName !== FILE_MAPPER)
                        .map(file => file.blob);

                    const parse$ = blobs.map((blob, blobIndex) => {
                        return this.blobToJson(blob)
                            .map(jsonData => (Array.isArray(jsonData) ? jsonData : [jsonData]))
                            .map(items => replaceUrls(items, oldNewUrlMapping))
                            .flatMap(items => this.validateAndParseItems(items, blobIndex));
                    });

                    return Future.parallel(parse$).map(results => {
                        return results.flat();
                    });
                });
        }
    }

    toEntries(data: TEntity[]): FutureData<FileEntry[]> {
        const entityFileEntries = data.map(entry => {
            const name = _.kebabCase(`${this.prefix}-${entry.name.referenceValue}`);
            const fileName = `${name}.json`;
            const blob = jsonToBlob(this.domainEntityToJsonModel(entry));
            return FileEntry.create({
                path: fileName,
                blob: blob,
            });
        });

        const dataEmbeddedUrls = _(data)
            .flatMap(item => getUrls(item))
            .uniq()
            .value();

        return getFilesWithMapping(dataEmbeddedUrls, this.baseUrl).map(files => [...entityFileEntries, ...files]);
    }

    private validateAndParseItems(items: unknown[], index?: number): FutureData<TEntity[]> {
        const validatedItems = items.map((item, itemIndex) => this.decodeJsonToDomainEntity(item, itemIndex));

        const errors = validatedItems.filter(item => item.isError());
        if (errors.length > 0) {
            const errorMessages = errors.map(error => String(error.value.error));
            console.error(errorMessages.join("\n"));
            return Future.error(`Validation error for file ${(index || 0) + 1}`);
        }

        const entities = validatedItems.filter(item => item.isSuccess()).map(item => item.value.data);
        return Future.success(_.compact(entities));
    }

    private decodeJsonToDomainEntity(item: unknown, index?: number): Either<Error, Maybe<TEntity>> {
        const decoded = this.codec.decode(item);

        if (decoded.isLeft()) {
            return Either.error(new Error(`Item ${(index || 0) + 1} validation failed: ${String(decoded.extract())}`));
        }

        const validatedData = decoded.toMaybe().extract();

        return Either.success(this.jsonModelToEntityModel(validatedData));
    }

    private parseFileMapper(file: FileEntry): FutureData<FileMap> {
        return this.blobToJson(file.blob).flatMap(fileMapBlob => {
            const decoded = FileMapModel.decode(fileMapBlob);
            if (decoded.isLeft()) {
                console.error(`File mapper validation failed: ${String(decoded.extract())}`);
                return Future.error(`File mapper validation failed: ${String(decoded.extract())}`);
            }
            return Future.success(decoded.toMaybe().extract() || []);
        });
    }

    private blobToJson(blob: Blob): FutureData<unknown> {
        return Future.fromPromise(blob.text())
            .flatMap(text => {
                try {
                    const jsonData = JSON.parse(text);
                    return Future.success(jsonData as unknown);
                } catch (error) {
                    console.error("Error parsing content:", error);
                    return Future.error(`Error parsing content: ${String(error)}`);
                }
            })
            .flatMapError(error => {
                console.error("Error processing content:", error);
                return Future.error(`Error processing content: ${String(error)}`);
            });
    }

    //Record<oldUrl, newUrl>
    private uploadAndGetOldNewUrlMapping(files: FileEntry[], fileMap: FileMap): FutureData<Record<string, string>> {
        return Future.fromPromise(
            promiseMap(files, async file => {
                const { blob, fileName } = file;
                const arrayBuffer = await blob.arrayBuffer();
                return { fileName, arrayBuffer };
            })
        )
            .flatMap(fileContents => {
                return Future.fromPromise(
                    promiseMap(fileContents, async ({ fileName, arrayBuffer }) => {
                        const fileUrl = await this.uploadFile(arrayBuffer, fileName);
                        return [fileName, fileUrl] as [string, string];
                    })
                );
            })
            .map(fileUrlByName => fromPairs(fileUrlByName))
            .map(fileUrlByNamePair =>
                _(fileMap)
                    .map(mappingItem => {
                        const fileUrl = fileUrlByNamePair[mappingItem.filename];
                        return fileUrl ? ([mappingItem.url, fileUrl] as [string, string]) : null;
                    })
                    .compact()
                    .fromPairs()
                    .value()
            )
            .flatMapError(error => Future.error(`Error getting URL mapping: ${String(error)}`));
    }
}
