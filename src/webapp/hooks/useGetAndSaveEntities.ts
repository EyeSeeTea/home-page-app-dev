import { LandingNode, LandingNodeStruct } from "../../domain/entities/LandingNode";
import { useAppContext } from "../contexts/app-context";
import { useCallback } from "react";
import { Id } from "../../domain/entities/Ref";
import { Action, ActionStruct } from "../../domain/entities/Action";
import { buildLandingNode } from "./useImportExport";
import { Notification } from "../../domain/entities/Notification";

export function useGetAndSaveLandingNodes(): GetAndSaveEntities<LandingNode> {
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
        async (ids?: Id[]) => {
            const allLandingNodes = await compositionRoot.landings.list();
            const landingNodes = ids ? allLandingNodes.filter(node => ids.includes(node.id)) : allLandingNodes;
            return landingNodes.flatMap(nodes => [nodes, ...nodes.children]);
        },
        [compositionRoot]
    );
    return [getLandingNodes, saveLandingNode];
}

export function useGetAndSaveActions(): GetAndSaveEntities<Action> {
    const { compositionRoot } = useAppContext();
    const saveActions = useCallback(
        async (actions: Action[]) => {
            return compositionRoot.actions.save(actions);
        },
        [compositionRoot]
    );
    const getActions = useCallback(
        async (ids?: string[]) => {
            const allActions = await compositionRoot.actions.list();
            return ids ? allActions.filter(action => ids.includes(action.id)) : allActions;
        },
        [compositionRoot]
    );
    return [getActions, saveActions];
}

export function useGetAndSaveLandingNodeStructs(): GetAndSaveEntities<LandingNodeStruct> {
    const [getLandingNodes, saveLandingNode] = useGetAndSaveLandingNodes();

    const getLandingNodeStructs = useCallback(
        async (ids?: Id[]) => {
            const landingNodes = await getLandingNodes(ids);
            return landingNodes.map(node => LandingNodeStruct.create(node));
        },
        [getLandingNodes]
    );

    const saveLandingNodeStructs = useCallback(
        (landingNodeStructs: LandingNodeStruct[]) => {
            const landingNodes = landingNodeStructs.map(node => node._getAttributes());
            return saveLandingNode(landingNodes);
        },
        [saveLandingNode]
    );
    return [getLandingNodeStructs, saveLandingNodeStructs];
}

export function useGetAndSaveActionStructs(): GetAndSaveEntities<ActionStruct> {
    const [getActions, saveActions] = useGetAndSaveActions();

    const getActionStructs = useCallback(
        async (ids?: Id[]) => {
            const actions = await getActions(ids);
            return actions.map(node => ActionStruct.create(node));
        },
        [getActions]
    );

    const saveActionStructs = useCallback(
        (actionStructs: ActionStruct[]) => {
            const actions = actionStructs.map(node => node._getAttributes());
            return saveActions(actions);
        },
        [saveActions]
    );
    return [getActionStructs, saveActionStructs];
}

export function useGetAndSaveNotifications(): GetAndSaveEntities<Notification> {
    const { compositionRoot, currentUser } = useAppContext();
    const saveNotifications = useCallback(
        async (notifications: Notification[]) => {
            return compositionRoot.notification.save(notifications, currentUser).toPromise();
        },
        [compositionRoot, currentUser]
    );
    const getNotifications = useCallback(
        (ids?: string[]) => {
            return compositionRoot.notification.list(currentUser, ids).toPromise();
        },
        [compositionRoot, currentUser]
    );
    return [getNotifications, saveNotifications];
}

type GetAndSaveEntities<T> = [
    getEntities: (ids?: Id[]) => Promise<T[]>,
    saveEntities: (entities: T[]) => Promise<void>
];
