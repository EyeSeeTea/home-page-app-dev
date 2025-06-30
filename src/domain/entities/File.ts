import { Maybe } from "../../types/utils";
import { Codec, Schema } from "../../utils/codec";

export type File = {
    name: string;
    contentType: string;
    content: Blob;
};

export type FilePath = {
    path: string;
    file: Maybe<File>;
};

export const FileModel: Codec<File> = Schema.object({
    name: Schema.string,
    contentType: Schema.string,
    content: Schema.blob,
});

export const FilePathModel: Codec<FilePath> = Schema.object({
    path: Schema.optionalSafe(Schema.string, ""),
    file: Schema.optional(FileModel),
});
