import { FileParser } from "./FileParser";
import { FileEntry } from "./models/FileEntry";
import { Future, FutureData } from "../../../domain/types/Future";
import { FileMap, FileMapModel } from "./models/FileMap";
import { fromPairs } from "../../../types/utils";
import { promiseMap } from "../../../utils/promises";
import _ from "lodash";

export abstract class BaseJsonParser<T> implements FileParser<T> {
    prefix: string;
    abstract fromEntity(files: FileEntry[]): FutureData<T[]>;
    abstract toEntries(data: T[]): FutureData<FileEntry[]>;

    protected constructor(
        protected baseUrl: string,
        protected uploadFile: (data: ArrayBuffer, name: string) => Promise<string>,
        prefix: string
    ) {
        this.prefix = prefix;
    }

    protected parseFileMapper(file: FileEntry): FutureData<FileMap> {
        return this.blobToJson(file.blob).flatMap(fileMapBlob => {
            const decoded = FileMapModel.decode(fileMapBlob);
            if (decoded.isLeft()) {
                console.error(`File mapper validation failed: ${String(decoded.extract())}`);
                return Future.error(`File mapper validation failed: ${String(decoded.extract())}`);
            }
            return Future.success(decoded.toMaybe().extract() || []);
        });
    }

    protected blobToJson(blob: Blob): FutureData<unknown> {
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
    protected uploadAndGetOldNewUrlMapping(files: FileEntry[], fileMap: FileMap): FutureData<Record<string, string>> {
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
