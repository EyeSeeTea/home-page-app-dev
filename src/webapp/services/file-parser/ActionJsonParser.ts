import { Maybe } from "../../../types/utils";
import { BaseJsonParser } from "./BaseJsonParser";
import { ActionModel, JSONActionModel } from "./models/ActionModel";
import { Action } from "../../../domain/entities/Action";

export class ActionJsonParser extends BaseJsonParser<Action, JSONActionModel> {
    constructor(protected baseUrl: string, protected uploadFile: (data: ArrayBuffer, name: string) => Promise<string>) {
        super(baseUrl, uploadFile, "action", ActionModel);
    }

    protected jsonModelToEntityModel(model?: JSONActionModel): Maybe<Action> {
        if (!model) return undefined;
        return {
            id: model.id,
            name: model.name,
            description: model.description,
            icon: model.icon,
            iconLocation: model.iconLocation,
            backgroundColor: model.backgroundColor,
            fontColor: model.fontColor,
            textAlignment: model.textAlignment,
            type: model.type,
            disabled: model.disabled,
            dhisVersionRange: model.dhisVersionRange,
            dhisAppKey: model.dhisAppKey,
            dhisLaunchUrl: model.dhisLaunchUrl,
            launchPageId: model.launchPageId,
            dhisAuthorities: model.dhisAuthorities,
            user: model.user,
            created: model.created,
            lastUpdated: model.lastUpdated,
            lastUpdatedBy: model.lastUpdatedBy,
            publicAccess: model.publicAccess,
            userAccesses: model.userAccesses,
            userGroupAccesses: model.userGroupAccesses,

            // Additional fields not present in the JSON model
            // should be replaced with fetched persisted models in data layer
            installed: false,
            compatible: false,
            editable: false,
        };
    }

    protected domainEntityToJsonModel(entity: Action): JSONActionModel {
        const { installed: _installed, compatible: _compatible, editable: _editable, ...jsonModel } = entity;
        return jsonModel;
    }
}
