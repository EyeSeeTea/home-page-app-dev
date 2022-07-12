import React from "react";
import { HashRouter, Route, Switch } from "react-router-dom";
import { ExamplePage } from "./example/ExamplePage";
import { LandingPage } from "./landing/LandingPage";
import { SettingsPage } from "./settings/SettingsPage";

export const Router: React.FC = React.memo(() => {
    return (
        <HashRouter>
            <Switch>
                <Route
                    path="/for/:name?"
                    render={({ match }) => <ExamplePage name={match.params.name ?? "Stranger"} />}
                />

                <Route path="/settings" render={() => <SettingsPage />} />

                {/* Default route */}
                <Route render={() => <LandingPage />} />
            </Switch>
        </HashRouter>
    );
});
