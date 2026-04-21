import { BinaryData } from "../../domain/entities/BinaryData";

export function filesToBinaryData(files: ReadonlyArray<File>): Promise<ReadonlyArray<BinaryData>> {
    return Promise.all(files.map(async file => ({ content: await file.arrayBuffer() })));
}
