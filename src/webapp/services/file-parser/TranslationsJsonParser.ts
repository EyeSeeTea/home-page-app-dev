import _ from "lodash";

import { blobToJson, FileParser, jsonToBlob } from "./FileParser";
import { EntityWithTranslations, Language, TranslatableText } from "../../../domain/entities/TranslatableText";
import { FileEntry } from "./models/FileEntry";
import { Future, FutureData } from "../../../domain/types/Future";

type Translations = Record<string, string>;
type TranslationMap = Record<Language, Translations>;

export class TranslationJsonParser<T extends EntityWithTranslations<T>> implements FileParser<Translations> {
    exportEntityTranslations<T extends EntityWithTranslations<T>>(entities: T[]): FutureData<FileEntry[]> {
        const translations = _(entities)
            .flatMap(entity => entity.getTranslations())
            .value();

        const translationLanguageMap = this.buildTranslationMap(translations);

        const $fileEntries = _(translationLanguageMap)
            .toPairs()
            .map(([lang, translations]) => {
                const fileName = `${lang}.json`;
                return this.toEntries(translations, fileName);
            })
            .value();
        return Future.parallel($fileEntries).map(fileEntries => _.flatMap(fileEntries));
    }

    importEntityTranslations<T extends EntityWithTranslations<T>>(
        file: FileEntry,
        entities: T[],
        lang: Language
    ): FutureData<T[]> {
        return this.fromEntries([file]).map(translationMap => {
            const translations = translationMap[lang] || {};
            return entities.map(entity => entity.setTranslations(translations, lang));
        });
    }

    fromEntries(files: FileEntry[]): FutureData<Translations> {
        const file = files[0];

        if (!file) return Future.error(`Error: File not found.`);

        return blobToJson(file.blob).flatMap<Translations>(jsonData => {
            if (this.isTranslations(jsonData)) {
                return Future.success(jsonData);
            }
            return Future.error("Invalid translations format");
        });
    }

    toEntries(data: Translations, filename: string): FutureData<FileEntry[]> {
        const fileName = `${filename}.json`;
        const blob = jsonToBlob(data);
        const entry = FileEntry.create({
            path: fileName,
            blob: blob,
        });
        return Future.success([entry]);
    }

    private isTranslations(obj: unknown): obj is Translations {
        if (typeof obj !== "object" || obj === null) return false;
        return Object.values(obj).every(value => typeof value === "string");
    }

    private buildTranslationMap(texts: TranslatableText[]): TranslationMap {
        const referenceStrings = _.fromPairs(texts.map(({ key, referenceValue }) => [key, referenceValue]));
        const translatedStrings = _(texts)
            .flatMap(({ key, translations }) => _.toPairs(translations).map(([lang, value]) => ({ lang, key, value })))
            .groupBy(({ lang }) => lang)
            .mapValues(array => _.fromPairs(array.map(({ key, value }) => [key, value])))
            .value();

        return { ...translatedStrings, en: referenceStrings };
    }
}
