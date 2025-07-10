import { FILE_MAPPER, FILES_FOLDER, getFilesWithMapping, jsonToBlob } from "./FileParser";
import { LandingNode } from "../../../domain/entities/LandingNode";
import _ from "lodash";
import { JSONLandingNodeModel, LandingNodeModel } from "./models/LandingNodeModel";
import { Future, FutureData } from "../../../domain/types/Future";
import { Either } from "../../../domain/types/Either";
import { Maybe } from "../../../types/utils";
import { FileEntry } from "./models/FileEntry";
import { getUrls, replaceUrls } from "../../../utils/urls";
import { BaseJsonParser } from "./BaseJsonParser";

export class LandingNodeJsonParser extends BaseJsonParser<LandingNode> {
    constructor(protected baseUrl: string, protected uploadFile: (data: ArrayBuffer, name: string) => Promise<string>) {
        super(baseUrl, uploadFile, "landing-node");
    }

    fromEntity(files: FileEntry[]): FutureData<LandingNode[]> {
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

    toEntries(data: LandingNode[]): FutureData<FileEntry[]> {
        const landingNodeFileEntries = data.map(entry => {
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

        return getFilesWithMapping(dataEmbeddedUrls, this.baseUrl).map(files => [...landingNodeFileEntries, ...files]);
    }

    private validateAndParseItems(items: unknown[], index?: number): FutureData<LandingNode[]> {
        const validatedItems = items.map((item, itemIndex) => this.decodeItems(item, itemIndex));

        const errors = validatedItems.filter(item => item.isError());
        if (errors.length > 0) {
            const errorMessages = errors.map(error => String(error.value.error));
            console.error(errorMessages.join("\n"));
            return Future.error(`Validation error for file ${(index || 0) + 1}`);
        }

        const landingNodes = validatedItems.filter(item => item.isSuccess()).map(item => item.value.data);
        return Future.success(_.compact(landingNodes));
    }

    private decodeItems(item: unknown, index?: number): Either<Error, Maybe<LandingNode>> {
        const decoded = LandingNodeModel.decode(item);

        if (decoded.isLeft()) {
            return Either.error(new Error(`Item ${(index || 0) + 1} validation failed: ${String(decoded.extract())}`));
        }

        const validatedData = decoded.toMaybe().extract();

        return Either.success(this.jsonModelToDomainEntity(validatedData));
    }

    private jsonModelToDomainEntity(model?: JSONLandingNodeModel): Maybe<LandingNode> {
        if (!model) return undefined;
        return {
            id: model.id,
            parent: model.parent,
            type: model.type,
            icon: model.icon,
            iconLocation: model.iconLocation,
            iconSize: model.iconSize,
            favicon: model.favicon,
            pageRendering: model.pageRendering,
            order: model.order,
            name: model.name,
            title: model.title,
            content: model.content,
            actions: model.actions,
            backgroundColor: model.backgroundColor,
            secondary: model.secondary,
            executeOnInit: model.executeOnInit,
            children: [],
        };
    }

    private domainEntityToJsonModel(entity: LandingNode): JSONLandingNodeModel {
        return _.omit(entity, "children");
    }
}
