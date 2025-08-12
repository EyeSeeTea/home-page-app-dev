import { Future, FutureData } from "../../../domain/types/Future";
import { FileEntry } from "./models/FileEntry";
import _ from "lodash";

export const FILE_MAPPER = "files.json";
export const FILES_FOLDER = "files";

export interface FileParser<T> {
    fromEntries(files: FileEntry[]): FutureData<T>;
    toEntries(data: T): FutureData<FileEntry[]>;
}

export function jsonToBlob<T>(contents: T): Blob {
    const json = JSON.stringify(contents, null, 4);
    return new Blob([json], { type: "application/json" });
}

export function blobToJson(blob: Blob): FutureData<unknown> {
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
