import { LoadingProvider, SnackbarProvider } from "@eyeseetea/d2-ui-components";
import { MuiThemeProvider, StylesProvider } from "@material-ui/core/styles";
import OldMuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import React, { useEffect } from "react";
import { Instance } from "../../data/entities/Instance";
import { getCompositionRoot } from "../CompositionRoot";
import { AppContextProvider } from "../contexts/app-context";
import { Router } from "../router/Router";
import muiThemeLegacy from "../themes/dhis2-legacy.theme";
import { muiTheme } from "../themes/dhis2.theme";
import { useConfig } from "./settings/useConfig";
import "./App.css";

const App: React.FC<{ locale: string; baseUrl: string }> = ({ locale, baseUrl }) => {
    const compositionRoot = getCompositionRoot(new Instance({ url: baseUrl }));

    return (
        <AppContextProvider compositionRoot={compositionRoot} locale={locale}>
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
