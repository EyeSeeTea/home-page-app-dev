import _c from "../../domain/entities/generic/Collection";
import { LandingNode } from "../../domain/entities/LandingNode";
import { Namespaces } from "../clients/storage/Namespaces";
import { StorageClient } from "../clients/storage/StorageClient";
import { PersistedLandingNode, PersistedLandingPage } from "../entities/PersistedLandingNode";
import { LandingNodeRepository } from "../../domain/repositories/LandingNodeRepository";
import { Instance } from "../entities/Instance";
import { DataStoreStorageClient } from "../clients/storage/DataStoreStorageClient";
import { Future, FutureData } from "../../domain/types/Future";
import i18n from "../../utils/i18n";

export class LandingNodeDefaultRepository implements LandingNodeRepository {
    private storageClient: StorageClient;

    constructor(instance: Instance) {
        this.storageClient = new DataStoreStorageClient({
            type: "global",
            instance: instance,
        });
    }

    public list(): FutureData<LandingNode[]> {
        return this.getAllLandingNodes();
    }

    public save(landingNodes: LandingNode[]): FutureData<void> {
        const notesToUpdate = this.extractChildren(landingNodes).map(node => this.mapLandingNodeToPersisted(node));

        return this._list()
            .map(persistedNodes => {
                const nodesToUpdateMap = _c(notesToUpdate).keyBy(node => node.id);

                return persistedNodes.map(node => {
                    const nodeToUpdate = nodesToUpdateMap.get(node.id);
                    return nodeToUpdate ? { ...node, ...nodeToUpdate } : node;
                });
            })
            .map(updatedNodes => this.buildLandingPage(updatedNodes))
            .flatMap(landingPages => this._save(landingPages));
    }

    private getAllLandingNodes(): FutureData<LandingNode[]> {
        return this._list().map(nodes => {
            const roots = nodes.filter(node => node.parent === "none");
            return roots.map(root => this.mapPersistedToLandingNode(root, nodes));
        });
    }

    private _list(): FutureData<PersistedLandingNode[]> {
        return Future.fromPromise(this.storageClient.getObject<PersistedLandingPage[]>(Namespaces.LANDING_PAGES))
            .map(persistedPages => (persistedPages ? persistedPages.flat() : []))
            .flatMapError(error => {
                console.error(`LandingNodes (get): ${error}`);
                return Future.error(`${i18n.t("An error has occurred fetching landing nodes")}\n${String(error)}`);
            });
    }

    private _save(landingPages: PersistedLandingPage[]): FutureData<void> {
        return Future.fromPromise(
            this.storageClient.saveObject<PersistedLandingPage[]>(Namespaces.LANDING_PAGES, landingPages)
        ).flatMapError(error => {
            console.error(`Notification (save): ${error}`);
            return Future.error(`${i18n.t("An error has occurred while saving notifications")}\n${String(error)}`);
        });
    }

    private mapPersistedToLandingNode(root: PersistedLandingNode, nodes: PersistedLandingNode[]): LandingNode {
        return {
            ...root,
            icon: {
                path: root.icon,
                file: undefined,
            },
            favicon: {
                path: root.icon,
                file: undefined,
            },
            children: _c(nodes)
                .filter(({ parent }) => parent === root.id)
                .sortBy(item => item.order ?? 1000)
                .map((node, order) => ({ ...this.mapPersistedToLandingNode(node, nodes), order }))
                .value(),
        };
    }

    private extractChildren(landingNodes: LandingNode[]): LandingNode[] {
        return landingNodes.flatMap(node => {
            const children = node.children.map(child => this.extractChildren([child]));
            return [node, ...children.flat()];
        });
    }

    private mapLandingNodeToPersisted(landingNode: LandingNode): PersistedLandingNode {
        const { children, icon, favicon, ...persistedNode } = landingNode;
        return {
            ...persistedNode,
            icon: icon.path,
            favicon: favicon.path,
        };
    }

    private buildLandingPage(landingNode: PersistedLandingNode[]): PersistedLandingPage[] {
        return _c(landingNode)
            .groupBy(landingNode => landingNode.id)
            .values();
    }
}
