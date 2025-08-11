import { Future, FutureData } from "../../../domain/types/Future";
import { FileEntry } from "./models/FileEntry";
import _ from "lodash";

export const FILE_MAPPER = "files.json";
export const FILES_FOLDER = "files";

export interface FileParser<T> {
    prefix: string;
    fromEntries(files: FileEntry[]): FutureData<T[]>;
    toEntries(data: T[]): FutureData<FileEntry[]>;
}

export function jsonToBlob<T>(contents: T): Blob {
    const json = JSON.stringify(contents, null, 4);
    return new Blob([json], { type: "application/json" });
}

export function getFilesWithMapping(urls: string[], baseUrlWithCredentials: string): FutureData<FileEntry[]> {
    const files$ = urls.map(url => {
        // When fetching resources from our DHIS2 instance in development, we need credentials=include,
        const credentials = !url.startsWith("http") || url.startsWith(baseUrlWithCredentials) ? "include" : "omit";
        return Future.fromPromise(
            fetch(url, { credentials })
                .then(res => (res.status >= 200 && res.status < 300 && !res.redirected ? res : Promise.reject()))
                .then(res => res.blob())
                .then(blob => ({ blob, url }))
                .catch(_err => null)
        );
    });

    return Future.parallel(files$)
        .map(blobs => {
            const validBlobs = _.compact(blobs);
            if (validBlobs.length === 0) {
                return [];
            }

            const files = validBlobs.map(({ url, blob }, idx) => {
                const filename = _.padStart(idx.toString(), 5, "0");
                return { url, filename, type: blob.type, blob, path: `${FILES_FOLDER}/${filename}` };
            });

            const mapping = files.map(({ url, filename, type }) => ({ url, filename, type }));
            const mappingFile = FileEntry.create({
                path: FILE_MAPPER,
                blob: jsonToBlob(mapping),
            });

            return [
                mappingFile,
                ...files.map(({ blob }, idx) => {
                    const filename = _.padStart(idx.toString(), 5, "0");
                    return FileEntry.create({ blob, path: `${FILES_FOLDER}/${filename}` });
                }),
            ];
        })
        .flatMapError(error => {
            const message = `Error fetching files: ${String(error)}`;
            console.error(message);
            return Future.error(message);
        });
}
