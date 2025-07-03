import { Struct } from "../../../../domain/entities/generic/Struct";

type FileEntryAttr = {
    blob: Blob;
    path: string;
};

export class FileEntry extends Struct<FileEntryAttr>() {
    get fileName(): string {
        return this.path.split("/").pop() ?? "";
    }

    get folderPath(): string {
        const parts = this.path.split("/");
        parts.pop();
        return parts.join("/");
    }
}
