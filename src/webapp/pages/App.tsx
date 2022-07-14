import { LoadingProvider, SnackbarProvider } from "@eyeseetea/d2-ui-components";
import { MuiThemeProvider, StylesProvider } from "@material-ui/core/styles";
import OldMuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import React from "react";
import { HashRouter } from "react-router-dom";
import { Instance } from "../../data/entities/Instance";
import i18n from "../../locales";
import { getCompositionRoot } from "../CompositionRoot";
import { AppContextProvider } from "../contexts/app-context";
import { AppRoute } from "../router/AppRoute";
import { Router } from "../router/Router";
import muiThemeLegacy from "../themes/dhis2-legacy.theme";
import { muiTheme } from "../themes/dhis2.theme";
import { AboutPage } from "./about/AboutPage";
import "./App.css";
import { EditPage } from "./edit/EditPage";
import { HomePage } from "./home/HomePage";
import { SettingsPage } from "./settings/SettingsPage";

export const routes: AppRoute[] = [
    {
        key: "home",
        name: () => i18n.t("Home"),
        defaultRoute: true,
        paths: ["/"],
        element: <HomePage />,
        backdrop: true,
    },
    {
        key: "settings",
        name: () => i18n.t("Settings"),
        paths: ["/settings"],
        element: <SettingsPage />,
    },
    {
        key: "about",
        name: () => i18n.t("About"),
        paths: ["/about"],
        element: <AboutPage />,
    },
    {
        key: "edit",
        name: () => i18n.t("Edit"),
        paths: ["/edit/:action"],
        element: <EditPage mode="edit" />,
    },
    {
        key: "clone",
        name: () => i18n.t("Clone"),
        paths: ["/clone/:action"],
        element: <EditPage mode="clone" />,
    },
    {
        key: "create",
        name: () => i18n.t("Create"),
        paths: ["/create"],
        element: <EditPage mode="create" />,
    },
];

const App: React.FC<{ locale: string; baseUrl: string }> = ({ locale, baseUrl }) => {
    const compositionRoot = getCompositionRoot(new Instance({ url: baseUrl }));

    return (
        <AppContextProvider routes={routes} compositionRoot={compositionRoot} locale={locale}>
            <StylesProvider injectFirst>
                <MuiThemeProvider theme={muiTheme}>
                    <OldMuiThemeProvider muiTheme={muiThemeLegacy}>
                        <SnackbarProvider>
                            <LoadingProvider>
                                <div id="app" className="content">
                                    <HashRouter>
                                        <Router baseUrl={baseUrl} />
                                    </HashRouter>
                                </div>
                            </LoadingProvider>
                        </SnackbarProvider>
                    </OldMuiThemeProvider>
                </MuiThemeProvider>
            </StylesProvider>
        </AppContextProvider>
    );
};

export default React.memo(App);