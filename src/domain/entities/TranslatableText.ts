import { GetSchemaType, Schema } from "../../utils/codec";
import _ from "lodash";

export const TranslatableTextModel = Schema.object({
    key: Schema.string,
    referenceValue: Schema.string,
    translations: Schema.dictionary(Schema.string, Schema.string),
});

export type TranslatableText = GetSchemaType<typeof TranslatableTextModel>;

export const buildTranslate = (locale: string): TranslateMethod => {
    return (text: TranslatableText): string => {
        const translations = text.translations ?? {};
        return translations[locale] || text.referenceValue;
    };
};

export type TranslateMethod = (string: TranslatableText) => string;
export type Translations = Record<string, string>;

type TranslateProps<T> = {
    item: T;
    language: string;
    term: string | undefined;
};
export function setTranslationValue<T extends TranslatableText>({ item, language, term }: TranslateProps<T>): T {
    if (term === undefined) {
        return item;
    } else if (language === "en") {
        return { ...item, referenceValue: term };
    } else {
        return { ...item, translations: { ...item.translations, [language]: term } };
    }
}

//{lang: {key: translatedText}}
type Language = string;
export type TranslationMap = Record<Language, Translations>;

export interface TranslatableEntity {
    extractTranslations: () => TranslatableText[];
}

export function buildTranslationMap(texts: TranslatableText[]): TranslationMap {
    const referenceStrings = _.fromPairs(texts.map(({ key, referenceValue }) => [key, referenceValue]));
    const translatedStrings = _(texts)
        .flatMap(({ key, translations }) => _.toPairs(translations).map(([lang, value]) => ({ lang, key, value })))
        .groupBy(({ lang }) => lang)
        .mapValues(array => _.fromPairs(array.map(({ key, value }) => [key, value])))
        .value();

    return { ...translatedStrings, en: referenceStrings };
}

export interface EntityWithTranslations<T> {
    translations: TranslatableText[];
    setTranslations(translations: Translations, language: Language): T;
}
