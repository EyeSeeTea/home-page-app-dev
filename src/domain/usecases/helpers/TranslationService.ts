import _ from "lodash";
import { buildTranslationMap, TranslationMap } from "../../entities/TranslatableText";
import { Notification } from "../../entities/Notification";
import { PersistedLandingNode } from "../../../data/entities/PersistedLandingNode";

export function extractLandingNodeTranslations(models: PersistedLandingNode[]): TranslationMap {
    const texts = _.flatMap(models, model => _.compact([model.name, model.title, model.content]));

    return buildTranslationMap(texts);
}

export function extractNotificationTranslations(models: Notification[]): TranslationMap {
    const texts = _.flatMap(models, model => _.compact([model.content]));
    return buildTranslationMap(texts);
}
