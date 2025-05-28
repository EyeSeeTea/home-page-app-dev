import _ from "lodash";
import { PersistedLandingNode } from "../../../data/entities/PersistedLandingNode";
import { TranslatableText } from "../../entities/TranslatableText";
//{lang: {key: translatedText}}
type Language = string;
type Translations = Record<Language, Record<string, string>>;

export class TranslationService {
    static extractTranslations(entity: PersistedLandingNode[]): Translations {
        const texts = _.flatMap(entity, model => _.compact([model.name, model.title, model.content]));
        return this.buildTranslationMap(texts);
    }
    static buildTranslationMap(texts: TranslatableText[]): Record<string, Record<string, string>> {
        const referenceStrings = _.fromPairs(texts.map(({ key, referenceValue }) => [key, referenceValue]));
        const translatedStrings = _(texts)
            .flatMap(({ key, translations }) => _.toPairs(translations).map(([lang, value]) => ({ lang, key, value })))
            .groupBy("lang")
            .mapValues(array => _.fromPairs(array.map(({ key, value }) => [key, value])))
            .value();

        return { ...translatedStrings, en: referenceStrings };
    }
}
