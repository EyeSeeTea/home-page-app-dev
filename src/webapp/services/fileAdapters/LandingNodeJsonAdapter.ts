import { FileAdapter, getFilesWithMapping, jsonToBlob } from "./FileAdapter";
import { LandingNode } from "../../../domain/entities/LandingNode";
import _ from "lodash";
import { JSONLandingNodeModel, LandingNodeModel } from "./models/LandingNodeModel";
import { Future, FutureData } from "../../../domain/types/Future";
import { Either } from "../../../domain/types/Either";
import { Maybe } from "../../../types/utils";
import { FileEntry } from "./models/FileEntry";
import { getUrls } from "../../../utils/urls";

export class LandingNodeJsonAdapter implements FileAdapter<LandingNode> {
    prefix: string;
    constructor(private baseUrl: string) {
        this.prefix = "landing-nodes";
    }

    parse(blobs: Blob[]): FutureData<LandingNode[]> {
        const parse$ = blobs.map((blob, blobIndex) => {
            return this.blobToJson(blob)
                .map(jsonData => (Array.isArray(jsonData) ? jsonData : [jsonData]))
                .flatMap(items => this.validateAndParseItems(items, blobIndex));
        });

        return Future.parallel(parse$).map(results => {
            return results.flat();
        });
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
