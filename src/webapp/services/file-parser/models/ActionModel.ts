import { GetSchemaType, Schema } from "../../../../utils/codec";
import { BaseMetadataModel } from "../../../../domain/entities/Ref";
import { TranslatableTextModel } from "../../../../domain/entities/TranslatableText";
import { ActionTypeModel, defaultTranslatableModel } from "../../../../domain/entities/Action";

export const ActionModel = Schema.extend(
    BaseMetadataModel,
    Schema.object({
        id: Schema.string,
        name: TranslatableTextModel,
        description: Schema.optionalSafe(TranslatableTextModel, defaultTranslatableModel("description")),
        icon: Schema.string,
        iconLocation: Schema.optionalSafe(Schema.string, ""),
        backgroundColor: Schema.optionalSafe(Schema.string, ""),
        fontColor: Schema.optionalSafe(Schema.string, ""),
        textAlignment: Schema.optionalSafe(Schema.string, ""),
        type: ActionTypeModel,
        disabled: Schema.optionalSafe(Schema.boolean, false),
        dhisVersionRange: Schema.string,
        dhisAppKey: Schema.string,
        dhisLaunchUrl: Schema.string,
        launchPageId: Schema.optionalSafe(Schema.string, ""),
        dhisAuthorities: Schema.array(Schema.string),
    })
);

export type JSONActionModel = GetSchemaType<typeof ActionModel>;
