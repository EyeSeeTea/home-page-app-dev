import { ReactRouterMatch } from "../router/AppRoute";

export type AppStateType = "HOME" | "UNKNOWN" | "SETTINGS" | "ABOUT" | "EDIT_MODULE" | "CLONE_MODULE" | "CREATE_MODULE";

interface BaseAppState {
    type: AppStateType;
}

interface UnknownAppState extends BaseAppState {
    type: "UNKNOWN";
}

interface HomeAppState extends BaseAppState {
    type: "HOME";
}

interface SettingsAppState extends BaseAppState {
    type: "SETTINGS";
}

interface AboutAppState extends BaseAppState {
    type: "ABOUT";
}

interface EditAppState extends BaseAppState {
    type: "EDIT_MODULE";
    module: string;
}

interface CloneAppState extends BaseAppState {
    type: "CLONE_MODULE";
    module: string;
}

interface CreateAppState extends BaseAppState {
    type: "CREATE_MODULE";
}

export type AppState =
    | UnknownAppState
    | HomeAppState
    | SettingsAppState
    | AboutAppState
    | EditAppState
    | CloneAppState
    | CreateAppState;

export const buildPathFromState = (state: AppState): string => {
    switch (state.type) {
        case "HOME":
            return `/`;
        case "SETTINGS":
            return `/settings`;
        case "ABOUT":
            return `/about`;
        case "EDIT_MODULE":
            return `/edit/${state.module}`;
        case "CLONE_MODULE":
            return `/clone/${state.module}`;
        case "CREATE_MODULE":
            return `/create`;
        default:
            return "/";
    }
};

export const buildStateFromPath = (matches: ReactRouterMatch[]): AppState => {
    for (const match of matches) {
        switch (match.route.path) {
            case "/":
                return { type: "HOME" };
            case "/settings":
                return { type: "SETTINGS" };
            case "/about":
                return { type: "ABOUT" };
            case "/edit/:module":
                return { type: "EDIT_MODULE", module: match.params.module ?? "" };
            case "/clone/:module":
                return { type: "CLONE_MODULE", module: match.params.module ?? "" };
            case "/create":
                return { type: "CREATE_MODULE" };
        }
    }
    return { type: "HOME" };
};
