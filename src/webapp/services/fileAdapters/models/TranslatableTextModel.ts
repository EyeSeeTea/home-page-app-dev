import { Schema } from "../../../../utils/codec";

export const TranslatableTextModel = Schema.object({
    key: Schema.string,
    referenceValue: Schema.string,
    translations: Schema.dictionary(Schema.string, Schema.string),
});
