import _ from "lodash";
import { TranslatableText } from "../../entities/TranslatableText";

//{lang: {key: translatedText}}
type Language = string;
type Translations = Record<Language, Record<string, string>>;

export class TranslationService {
    static extractTranslations<T>(entities: T[]): Translations {
        const keys = Object.keys(entities[0] || {}) as (keyof T)[];

        const texts = entities.flatMap(entity =>
            keys.flatMap(key => {
                const value = entity[key];
                return TranslationService.isTranslatableText(value) ? [value] : [];
            })
        );

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

    private static isTranslatableText(obj: unknown): obj is TranslatableText {
        return (
            typeof obj === "object" && obj !== null && "key" in obj && "referenceValue" in obj && "translations" in obj
        );
    }
}
