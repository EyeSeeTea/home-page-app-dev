import { LoadingProvider, SnackbarProvider } from "@eyeseetea/d2-ui-components";
import { UserNotificationDialog } from "../components/notifications/UserNotificationDialog";
import { useNotifications } from "../hooks/useNotifications";
import { MuiThemeProvider, StylesProvider } from "@material-ui/core/styles";
import OldMuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import React, { useEffect } from "react";
import { AppContextProvider } from "../contexts/app-context";
import { Router } from "../router/Router";
import muiThemeLegacy from "../themes/dhis2-legacy.theme";
import { muiTheme } from "../themes/dhis2.theme";
import { useConfig } from "./settings/useConfig";
import "./App.css";
import Typography from "@material-ui/core/Typography";
import i18n from "../../utils/i18n";
import { CompositionRoot, getCompositionRoot } from "../CompositionRoot";
import { Instance } from "../../data/entities/Instance";
import { User } from "../../domain/entities/User";

const App: React.FC<{ locale: string; baseUrl: string }> = ({ locale, baseUrl }) => {
    const [compositionRoot, setCompositionRoot] = React.useState<CompositionRoot>();
    const [currentUser, setCurrentUser] = React.useState<User>();

    React.useEffect(() => {
        async function initialize() {
            const instance = new Instance({ url: baseUrl });
            const root = await getCompositionRoot(instance);
            const user = await root.user.getCurrent().toPromise();
            setCompositionRoot(root);
            setCurrentUser(user);
        }
        initialize();
    }, [baseUrl]);

    const { notifications, markAsRead } = useNotifications(compositionRoot, currentUser);

    if (!compositionRoot || !currentUser) {
        return <Typography>{i18n.t("Loading...")}</Typography>;
    }

    return (
        <>
            {notifications.map(notification => (
                <UserNotificationDialog
                    key={notification.id}
                    notifications={[notification]}
                    onClose={() => {}}
                    onConfirm={() => markAsRead(notification)}
                />
            ))}
            <AppContextProvider locale={locale} compositionRoot={compositionRoot} currentUser={currentUser}>
                <Analytics />
                <StylesProvider injectFirst>
                    <MuiThemeProvider theme={muiTheme}>
                        <OldMuiThemeProvider muiTheme={muiThemeLegacy}>
                            <SnackbarProvider>
                                <LoadingProvider>
                                    <div id="app" className="content">
                                        <Router />
                                    </div>
                                </LoadingProvider>
                            </SnackbarProvider>
                        </OldMuiThemeProvider>
                    </MuiThemeProvider>
                </StylesProvider>
            </AppContextProvider>
        </>
    );
};

const Analytics: React.FC = () => {
    const { googleAnalyticsCode } = useConfig();

    useEffect(() => {
        if (!googleAnalyticsCode) return;
        const headElement = document.head || document.getElementsByTagName("head")[0];
        const src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsCode}`;
        const scriptAlreadyExist = (headElement.firstChild as HTMLScriptElement).src === src;

        if (scriptAlreadyExist) return;

        const scriptElement = document.createElement("script");
        scriptElement.async = true;
        scriptElement.src = src;
        headElement.insertBefore(scriptElement, headElement.firstChild);
    }, [googleAnalyticsCode]);

    return <></>; //return as <script/> seems GA doesn't like that :$
};

export default React.memo(App);
