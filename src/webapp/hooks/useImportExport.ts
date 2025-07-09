import _ from "lodash";
import { useCallback } from "react";

import { useAppContext } from "../contexts/app-context";
import { LandingNodeJsonAdapter } from "../services/fileAdapters/LandingNodeJsonAdapter";
import { ZipClient } from "../services/ZipClient";
import { LandingNode } from "../../domain/entities/LandingNode";
import { FileAdapter } from "../services/fileAdapters/FileAdapter";

type ImportExportFunctions = {
    handleExport: (ids: string[]) => Promise<void>;
    handleImport: (files: File[]) => Promise<number>;
};

export function useImportExport(type: "landing-page" | "action"): ImportExportFunctions {
    const { compositionRoot, apiBaseUrl } = useAppContext();

    const { saveLandingNode, getLandingNodes } = useImportExportLandingNode();

    switch (type) {
        case "landing-page": {
            const adapter = new LandingNodeJsonAdapter(apiBaseUrl, compositionRoot.instance.uploadFile);
            return {
                handleExport: exportEntities(getLandingNodes, adapter),
                handleImport: importEntities(saveLandingNode, adapter),
            };
        }
        case "action":
            throw new Error("Not implemented yet.");
    }
}

function importEntities<T>(saveFn: (entities: T[]) => void, adapter: FileAdapter<T>) {
    return async (files: File[]): Promise<number> => {
        const fileEntries = await ZipClient.extractFiles(files);
        const entitiesToImport = await adapter.parse(fileEntries).toPromise();
        await saveFn(entitiesToImport);

        return entitiesToImport.length;
    };
}

function exportEntities<T>(getFn: (ids: string[]) => Promise<T[]>, adapter: FileAdapter<T>) {
    return async (ids: string[]) => {
        const entitiesToExport = await getFn(ids);
        const fileEntries = await adapter.toEntries(entitiesToExport).toPromise();

        return await ZipClient.zipAndDownload(fileEntries, "landing-pages");
    };
}

function useImportExportLandingNode() {
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
    return {
        saveLandingNode,
        getLandingNodes,
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
