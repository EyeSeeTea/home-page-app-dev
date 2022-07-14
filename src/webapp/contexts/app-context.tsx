import _ from "lodash";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { CompositionRoot } from "../CompositionRoot";
import { LandingNode } from "../../domain/entities/LandingNode";
import { Action } from "../../domain/entities/Action";
import { buildTranslate, TranslateMethod } from "../../domain/entities/TranslatableText";

import { AppState } from "../entities/AppState";
import { AppRoute } from "../router/AppRoute";
import { cacheImages } from "../utils/image-cache";
import axios from "axios";

const AppContext = React.createContext<AppContextState | null>(null);

const isDev = process.env.NODE_ENV === "development";

const getLaunchAppBaseUrl = async () => {
    if (isDev) {
        return process.env.REACT_APP_DHIS2_BASE_URL;
    } else {
        const { data: manifest } = await axios.get<any>("manifest.webapp");
        return manifest.activities.dhis.href;
    }
};

export const AppContextProvider: React.FC<AppContextProviderProps> = ({
    children,
    routes,
    compositionRoot,
    locale,
}) => {
    const [appState, setAppState] = useState<AppState>({ type: "UNKNOWN" });
    const [actions, setActions] = useState<Action[]>([]);
    const [landings, setLandings] = useState<LandingNode[]>([]);
    const [hasSettingsAccess, setHasSettingsAccess] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAllActions, setShowAllActions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const translate = buildTranslate(locale);

    const reload = useCallback(async () => {
        setIsLoading(true);

        const modules = await compositionRoot.usecases.actions.list();
        const landings = await compositionRoot.usecases.landings.list();
        const showAllActions = await compositionRoot.usecases.config.getShowAllActions();

        cacheImages(JSON.stringify(modules));
        cacheImages(JSON.stringify(landings));

        setActions(modules);
        setLandings(landings);
        setShowAllActions(showAllActions);
        setIsLoading(false);
    }, [compositionRoot]);

    const updateAppState = useCallback((update: AppState | ((prevState: AppState) => AppState)) => {
        setAppState(prevState => {
            const nextState = _.isFunction(update) ? update(prevState) : update;
            return nextState;
        });
    }, []);

    useEffect(() => {
        compositionRoot.usecases.user.checkSettingsPermissions().then(setHasSettingsAccess);
        compositionRoot.usecases.user.checkAdminAuthority().then(setIsAdmin);
        compositionRoot.usecases.config.getShowAllActions().then(setShowAllActions);
    }, [compositionRoot]);

    return (
        <AppContext.Provider
            value={{
                routes,
                compositionRoot,
                appState,
                setAppState: updateAppState,
                actions,
                landings,
                translate,
                reload,
                isLoading,
                hasSettingsAccess,
                isAdmin,
                showAllActions,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export function useAppContext(): UseAppContextResult {
    const context = useContext(AppContext);
    if (!context) throw new Error("Context not initialized");

    const {
        compositionRoot,
        routes,
        appState,
        setAppState,
        actions,
        landings,
        translate,
        reload,
        isLoading,
        hasSettingsAccess,
        isAdmin,
        showAllActions,
    } = context;
    const { usecases } = compositionRoot;
    const [action, setCurrentAction] = useState<Action>();
    const [launchAppBaseUrl, setLaunchAppBaseUrl] = useState<string>("");

    useEffect(() => {
        setCurrentAction(
            appState.type === "EDIT_MODULE" || appState.type === "CLONE_MODULE"
                ? actions.find(({ id }) => id === appState.module)
                : undefined
        );
    }, [appState, actions]);

    useEffect(() => {
        getLaunchAppBaseUrl().then(setLaunchAppBaseUrl);
    }, []);

    return {
        appState,
        setAppState,
        routes,
        usecases,
        actions,
        landings,
        action,
        translate,
        reload,
        isLoading,
        hasSettingsAccess,
        isAdmin,
        showAllActions,
        launchAppBaseUrl,
    };
}

type AppStateUpdateMethod = (oldState: AppState) => AppState;
type ReloadMethod = () => Promise<void>;

export interface AppContextProviderProps {
    routes: AppRoute[];
    compositionRoot: CompositionRoot;
    locale: string;
}

export interface AppContextState {
    appState: AppState;
    setAppState: (appState: AppState | AppStateUpdateMethod) => void;
    actions: Action[];
    landings: LandingNode[];
    routes: AppRoute[];
    compositionRoot: CompositionRoot;
    translate: TranslateMethod;
    reload: ReloadMethod;
    isLoading: boolean;
    hasSettingsAccess: boolean;
    isAdmin: boolean;
    showAllActions: boolean;
}

interface UseAppContextResult {
    appState: AppState;
    setAppState: (appState: AppState | AppStateUpdateMethod) => void;
    routes: AppRoute[];
    usecases: CompositionRoot["usecases"];
    actions: Action[];
    landings: LandingNode[];
    action?: Action;
    translate: TranslateMethod;
    reload: ReloadMethod;
    isLoading: boolean;
    hasSettingsAccess: boolean;
    isAdmin: boolean;
    showAllActions: boolean;
    launchAppBaseUrl: string;
}
