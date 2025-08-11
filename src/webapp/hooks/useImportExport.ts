import _ from "lodash";
import { useCallback } from "react";

import { useAppContext } from "../contexts/app-context";
import { LandingNodeJsonParser } from "../services/file-parser/LandingNodeJsonParser";
import { ZipClient } from "../services/ZipClient";
import { LandingNode } from "../../domain/entities/LandingNode";
import { FileParser } from "../services/file-parser/FileParser";
import { Action } from "../../domain/entities/Action";
import { ActionJsonParser } from "../services/file-parser/ActionJsonParser";

export function useImportExport(type: "landing-page" | "action"): ImportExportFunctions {
    const { compositionRoot, apiBaseUrl } = useAppContext();

    const [getLandingNodes, saveLandingNode] = useGetAndSaveLandingNodes();
    const [getActions, saveActions] = useGetAndSaveActions();

    switch (type) {
        case "landing-page": {
            const parser = new LandingNodeJsonParser(apiBaseUrl, compositionRoot.instance.uploadFile);
            return {
                handleExport: exportEntities(getLandingNodes, parser),
                handleImport: importEntities(saveLandingNode, parser),
            };
        }
        case "action": {
            const parser = new ActionJsonParser(apiBaseUrl, compositionRoot.instance.uploadFile);
            return {
                handleExport: exportEntities(getActions, parser),
                handleImport: importEntities(saveActions, parser),
            };
        }
    }
}

function importEntities<T>(saveFn: (entities: T[]) => Promise<void>, parser: FileParser<T>) {
    return async (files: File[]): Promise<number> => {
        const fileEntries = await ZipClient.extractFiles(files);
        const entitiesToImport = await parser.fromEntries(fileEntries).toPromise();
        await saveFn(entitiesToImport);

        return entitiesToImport.length;
    };
}

function exportEntities<T>(getFn: (ids: string[]) => Promise<T[]>, parser: FileParser<T>) {
    return async (ids: string[]) => {
        const entitiesToExport = await getFn(ids);
        const fileEntries = await parser.toEntries(entitiesToExport).toPromise();

        return await ZipClient.zipAndDownload(fileEntries, "landing-pages");
    };
}

function useGetAndSaveLandingNodes(): GetAndSafeEntities<LandingNode> {
    const { compositionRoot } = useAppContext();
    const saveLandingNode = useCallback(
        async (landingNodes: LandingNode[]) => {
            const rootNodes = landingNodes
                .filter(node => node.type === "root")
                .map(rootNode => buildLandingNode(rootNode, landingNodes));
            await Promise.all(rootNodes.map(rootNode => compositionRoot.landings.update(rootNode)));
        },
        [compositionRoot]
    );
    const getLandingNodes = useCallback(
        async (ids: string[]) => {
            const landingNodes = await compositionRoot.landings.list();
            return landingNodes.filter(node => ids.includes(node.id)).flatMap(nodes => [nodes, ...nodes.children]);
        },
        [compositionRoot]
    );
    return [getLandingNodes, saveLandingNode];
}

function useGetAndSaveActions(): GetAndSafeEntities<Action> {
    const { compositionRoot } = useAppContext();
    const saveActions = useCallback(
        async (actions: Action[]) => {
            return compositionRoot.actions.save(actions);
        },
        [compositionRoot]
    );
    const getActions = useCallback(
        async (ids: string[]) => {
            const actions = await compositionRoot.actions.list();
            return actions.filter(action => ids.includes(action.id));
        },
        [compositionRoot]
    );
    return [getActions, saveActions];
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
    handleExport: (ids: string[]) => Promise<void>;
    handleImport: (files: File[]) => Promise<number>;
};

type GetAndSafeEntities<T> = [
    getEntities: (ids: string[]) => Promise<T[]>,
    saveEntities: (entities: T[]) => Promise<void>
];
