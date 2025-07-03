import { useAppContext } from "../contexts/app-context";
import { useCallback } from "react";
import { LandingNodeJsonAdapter } from "../services/fileAdapters/LandingNodeJsonAdapter";
import { ZipClient } from "../services/ZipClient";
import { LandingNode } from "../../domain/entities/LandingNode";
import { CompositionRoot } from "../CompositionRoot";
import { FILES_FOLDER } from "../services/fileAdapters/FileAdapter";

type ImportExportFunctions = {
    handleExport: (ids: string[]) => Promise<void>;
    handleImport: (files: File[]) => Promise<number>;
};

export function useImportExport(type: "landing-page" | "action"): ImportExportFunctions {
    const { compositionRoot } = useAppContext();
    const baseUrl = compositionRoot.instance.getBaseUrl();

    switch (type) {
        case "landing-page": {
            const adapter = new LandingNodeJsonAdapter(baseUrl);
            return {
                handleExport: exportLandingPage(compositionRoot, adapter),
                handleImport: importLandingPage(compositionRoot, adapter),
            };
        }
        case "action":
            throw new Error("Not implemented yet.");
    }
}

function importLandingPage(compositionRoot: CompositionRoot, adapter: LandingNodeJsonAdapter) {
    return async (files: File[]): Promise<number> => {
        const fileEntries = await ZipClient.extractFiles(files);

        const filesToUpload = fileEntries.filter(file => file.folderPath === FILES_FOLDER);

        return 2;
    };
}

function exportLandingPage(compositionRoot: CompositionRoot, adapter: LandingNodeJsonAdapter) {
    return async (ids: string[]) => {
        const landingNodes = await compositionRoot.landings.list();
        const landingNodesToExport = landingNodes
            .filter(node => ids.includes(node.id))
            .flatMap(nodes => [nodes, ...nodes.children]);

        const fileEntries = await adapter.toEntries(landingNodesToExport).toPromise();

        return await ZipClient.zipAndDownload(fileEntries, "landing-pages");
    };
}
