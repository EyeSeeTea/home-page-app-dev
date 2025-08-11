import { LandingNode } from "../../../domain/entities/LandingNode";
import { JSONLandingNodeModel, LandingNodeModel } from "./models/LandingNodeModel";
import { Maybe } from "../../../types/utils";
import { BaseJsonParser } from "./BaseJsonParser";

export class LandingNodeJsonParser extends BaseJsonParser<LandingNode, JSONLandingNodeModel> {
    constructor(protected baseUrl: string, protected uploadFile: (data: ArrayBuffer, name: string) => Promise<string>) {
        super(baseUrl, uploadFile, "landing-node", LandingNodeModel);
    }

    protected jsonModelToEntityModel(model?: JSONLandingNodeModel): Maybe<LandingNode> {
        if (!model) return undefined;
        return {
            id: model.id,
            parent: model.parent,
            type: model.type,
            icon: model.icon,
            iconLocation: model.iconLocation,
            iconSize: model.iconSize,
            favicon: model.favicon,
            pageRendering: model.pageRendering,
            order: model.order,
            name: model.name,
            title: model.title,
            content: model.content,
            actions: model.actions,
            backgroundColor: model.backgroundColor,
            secondary: model.secondary,
            executeOnInit: model.executeOnInit,
            children: [],
        };
    }

    protected domainEntityToJsonModel(entity: LandingNode): JSONLandingNodeModel {
        const { children: _, ...jsonModel } = entity;
        return jsonModel;
    }
}
