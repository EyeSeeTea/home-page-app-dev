import { ReactRouterMatch } from "../router/AppRoute";

export type AppStateType = "HOME" | "UNKNOWN" | "SETTINGS" | "ABOUT" | "EDIT_ACTION" | "CLONE_ACTION" | "CREATE_ACTION";

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
    type: "EDIT_ACTION";
    action: string;
}

interface CloneAppState extends BaseAppState {
    type: "CLONE_ACTION";
    action: string;
}

interface CreateAppState extends BaseAppState {
    type: "CREATE_ACTION";
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
        case "EDIT_ACTION":
            return `/edit/${state.action}`;
        case "CLONE_ACTION":
            return `/clone/${state.action}`;
        case "CREATE_ACTION":
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
            case "/edit/:action":
                return { type: "EDIT_ACTION", action: match.params.action ?? "" };
            case "/clone/:action":
                return { type: "CLONE_ACTION", action: match.params.action ?? "" };
            case "/create":
                return { type: "CREATE_ACTION" };
        }
    }
    return { type: "HOME" };
};
