import { GetSchemaType, Schema } from "../../../../utils/codec";

export const TranslatableTextModel = Schema.object({
    key: Schema.string,
    referenceValue: Schema.string,
    translations: Schema.dictionary(Schema.string, Schema.string),
});

export const TranslationsMode = Schema.dictionary(Schema.string, Schema.string);

export type JSONTranslationsModel = GetSchemaType<typeof TranslationsMode>;
