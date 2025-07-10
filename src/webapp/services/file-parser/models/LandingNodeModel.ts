import { GetSchemaType, Schema } from "../../../../utils/codec";
import { TranslatableTextModel } from "./TranslatableTextModel";

export const LandingNodeModel = Schema.object({
    id: Schema.string,
    parent: Schema.string,
    type: Schema.oneOf([
        Schema.exact("root"),
        Schema.exact("section"),
        Schema.exact("sub-section"),
        Schema.exact("category"),
    ]),
    icon: Schema.optionalSafe(Schema.string, ""),
    iconLocation: Schema.optionalSafe(Schema.string, ""),
    iconSize: Schema.optionalSafe(Schema.string, ""),
    favicon: Schema.optionalSafe(Schema.string, ""),
    pageRendering: Schema.optional(Schema.oneOf([Schema.exact("single"), Schema.exact("multiple")])),
    order: Schema.optional(Schema.integer),
    name: TranslatableTextModel,
    title: Schema.optional(TranslatableTextModel),
    content: Schema.optional(TranslatableTextModel),
    actions: Schema.optionalSafe(Schema.array(Schema.string), []),
    backgroundColor: Schema.optionalSafe(Schema.string, ""),
    secondary: Schema.optional(Schema.boolean),
    executeOnInit: Schema.optionalSafe(Schema.boolean, true),
});

export type JSONLandingNodeModel = GetSchemaType<typeof LandingNodeModel>;
