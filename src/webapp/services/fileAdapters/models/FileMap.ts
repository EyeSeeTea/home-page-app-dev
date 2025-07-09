import { GetSchemaType, Schema } from "../../../../utils/codec";

export const FileMapItemModel = Schema.object({
    url: Schema.string,
    filename: Schema.string,
    type: Schema.string,
});

export const FileMapModel = Schema.array(FileMapItemModel);

export type FileMap = GetSchemaType<typeof FileMapModel>;
