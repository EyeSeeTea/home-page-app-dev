import _ from "lodash";

import { useAppContext } from "../contexts/app-context";
import { LandingNodeJsonParser } from "../services/file-parser/LandingNodeJsonParser";
import { ZipClient } from "../services/ZipClient";
import { LandingNode, LandingNodeStruct } from "../../domain/entities/LandingNode";
import { FileParser } from "../services/file-parser/FileParser";
import { ActionJsonParser } from "../services/file-parser/ActionJsonParser";
import { EntityWithTranslations, Language } from "../../domain/entities/TranslatableText";
import { TranslationJsonParser } from "../services/file-parser/TranslationsJsonParser";
import { Id } from "../../domain/entities/Ref";
import {
    useGetAndSaveActions,
    useGetAndSaveActionStructs,
    useGetAndSaveLandingNodes,
    useGetAndSaveLandingNodeStructs,
    useGetAndSaveNotifications,
} from "./useGetAndSaveEntities";
import { ActionStruct } from "../../domain/entities/Action";
import { Notification } from "../../domain/entities/Notification";

export function useImportExport(type: "landing-page" | "action"): ImportExportFunctions {
    const { compositionRoot, apiBaseUrl } = useAppContext();

    const [getLandingNodes, saveLandingNodes] = useGetAndSaveLandingNodes();
    const [getActions, saveActions] = useGetAndSaveActions();

    switch (type) {
        case "landing-page": {
            const parser = new LandingNodeJsonParser(apiBaseUrl, compositionRoot.instance.uploadFile);
            return {
                handleExport: exportEntities(getLandingNodes, parser, type),
                handleImport: importEntities(saveLandingNodes, parser),
            };
        }
        case "action": {
            const parser = new ActionJsonParser(apiBaseUrl, compositionRoot.instance.uploadFile);
            return {
                handleExport: exportEntities(getActions, parser, type),
                handleImport: importEntities(saveActions, parser),
            };
        }
    }
}

export function useImportExportTranslations(
    type: "landing-page" | "action" | "notification"
): ImportExportTranslationFunctions {
    const [getLandingNodes, saveLandingNodes] = useGetAndSaveLandingNodeStructs();
    const [getActions, saveActions] = useGetAndSaveActionStructs();
    const [getNotifications, saveNotifications] = useGetAndSaveNotifications();

    const landingNodeTranslationParser = new TranslationJsonParser<LandingNodeStruct>();
    const actionTranslationParser = new TranslationJsonParser<ActionStruct>();
    const notificationTranslationParser = new TranslationJsonParser<Notification>();

    switch (type) {
        case "landing-page": {
            return {
                handleExport: exportEntityTranslations(getLandingNodes, landingNodeTranslationParser, type),
                handleImport: importEntityTranslations(getLandingNodes, saveLandingNodes, landingNodeTranslationParser),
            };
        }
        case "action": {
            return {
                handleExport: exportEntityTranslations(getActions, actionTranslationParser, type),
                handleImport: importEntityTranslations(getActions, saveActions, actionTranslationParser),
            };
        }
        case "notification": {
            return {
                handleExport: exportEntityTranslations(getNotifications, notificationTranslationParser, type),
                handleImport: importEntityTranslations(
                    getNotifications,
                    saveNotifications,
                    notificationTranslationParser
                ),
            };
        }
    }
}

function importEntities<T>(saveFn: (entities: T[]) => Promise<void>, parser: FileParser<T[]>) {
    return async (files: File[]): Promise<number> => {
        const fileEntries = await ZipClient.extractFiles(files);
        const entitiesToImport = await parser.fromEntries(fileEntries).toPromise();
        await saveFn(entitiesToImport);

        return entitiesToImport.length;
    };
}

function exportEntities<T>(
    getFn: (ids: Id[]) => Promise<T[]>,
    parser: FileParser<T[]>,
    type: "landing-page" | "action"
) {
    return async (ids: Id[]) => {
        const entitiesToExport = await getFn(ids);
        const fileEntries = await parser.toEntries(entitiesToExport).toPromise();

        return await ZipClient.zipAndDownload(fileEntries, type);
    };
}

function importEntityTranslations<T extends EntityWithTranslations<T>>(
    getFn: (ids?: Id[]) => Promise<T[]>,
    saveFn: (entities: T[]) => Promise<void>,
    parser: TranslationJsonParser<T>
) {
    return async (file: File, lang: Language, ids?: Id[]): Promise<number> => {
        const entities = await getFn(ids);

        const fileEntries = await ZipClient.extractFiles([file]);
        const fileEntry = fileEntries[0];
        if (fileEntry) {
            const entitiesToImport = await parser.importEntityTranslations(fileEntry, entities, lang).toPromise();
            await saveFn(entitiesToImport);

            return entitiesToImport.length;
        } else {
            return 0;
        }
    };
}

function exportEntityTranslations<T extends EntityWithTranslations<T>>(
    getFn: (ids: Id[]) => Promise<T[]>,
    parser: TranslationJsonParser<T>,
    type: "landing-page" | "action" | "notification"
) {
    return async (ids: Id[]) => {
        const entitiesToExport = await getFn(ids);
        const fileEntries = await parser.exportEntityTranslations(entitiesToExport).toPromise();

        return await ZipClient.zipAndDownload(fileEntries, `translations-${type}`);
    };
}

export const buildLandingNode = (root: LandingNode, items: LandingNode[]): LandingNode => {
    return {
        ...root,
        children: _(items)
            .filter(({ parent }) => parent === root.id)
            .sortBy(item => item.order ?? 1000)
            .map((node, order) => ({ ...buildLandingNode(node, items), order }))
            .value(),
    };
};

type ImportExportFunctions = {
    handleExport: (ids: Id[]) => Promise<void>;
    handleImport: (files: File[]) => Promise<number>;
};

type ImportExportTranslationFunctions = {
    handleExport: (ids: Id[]) => Promise<void>;
    handleImport: (file: File, lang: Language, ids?: Id[]) => Promise<number>;
};
