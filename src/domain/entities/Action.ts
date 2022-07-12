import { PartialBy } from "../../types/utils";
import { GetSchemaType, Schema } from "../../utils/codec";
import { BaseMetadataModel } from "./Ref";
import { TranslatableTextModel } from "./TranslatableText";
import { ModelValidation } from "./Validation";

export const ActionTypeModel = Schema.oneOf([
    Schema.exact("app"),
    // Schema.exact("core"),
    // Schema.exact("widget"),
]);

export const ActionModel = Schema.extend(
    BaseMetadataModel,
    Schema.object({
        id: Schema.string,
        name: TranslatableTextModel,
        icon: Schema.string,
        type: ActionTypeModel,
        disabled: Schema.optionalSafe(Schema.boolean, false),
        dhisVersionRange: Schema.string,
        dhisAppKey: Schema.string,
        dhisLaunchUrl: Schema.string,
        dhisAuthorities: Schema.array(Schema.string),
        installed: Schema.boolean,
        compatible: Schema.boolean,
        editable: Schema.boolean,
        outdated: Schema.boolean,
        builtin: Schema.boolean,
    })
);

export type Action = GetSchemaType<typeof ActionModel>;
export type ActionType = GetSchemaType<typeof ActionTypeModel>;

export type PartialTrainingModule = PartialBy<
    Action,
    | "user"
    | "created"
    | "lastUpdated"
    | "lastUpdatedBy"
    | "publicAccess"
    | "userAccesses"
    | "userGroupAccesses"
    | "installed"
    | "editable"
    | "compatible"
    | "outdated"
    | "builtin"
>;

export const isValidTrainingType = (type: string): type is ActionType => {
    //return ["app", "core", "widget"].includes(type);
    return ["app"].includes(type);
};

export const trainingModuleValidations: ModelValidation[] = [
    {
        property: "id",
        validation: "hasValue",
        alias: "code",
    },
    {
        property: "name.referenceValue",
        validation: "hasValue",
        alias: "name",
    },
];

export const defaultTrainingModule: PartialTrainingModule = {
    id: "",
    name: { key: "module-name", referenceValue: "", translations: {} },
    icon: "",
    type: "app",
    dhisVersionRange: "",
    dhisAppKey: "",
    dhisLaunchUrl: "",
    dhisAuthorities: [],
    disabled: false,
};