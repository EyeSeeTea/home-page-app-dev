import { LoadingProvider, SnackbarProvider } from "@eyeseetea/d2-ui-components";
import { MuiThemeProvider, StylesProvider } from "@material-ui/core/styles";
import OldMuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import React from "react";
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

    React.useEffect(() => {
        if (!googleAnalyticsCode) return;
        window.dataLayer = window.dataLayer || [];
        window.gtag = (...args) => {
            window.dataLayer.push(args);
        };
    }, [googleAnalyticsCode]);

    if (!googleAnalyticsCode) return <></>;
    return (
        <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsCode}`}></script>
        </>
    );
};

export default React.memo(App);
