import React, { useCallback, useEffect, useMemo, useState } from "react";
import { matchRoutes, useLocation, useNavigate, useRoutes } from "react-router-dom";
import styled from "styled-components";
import { useAppContext } from "../contexts/app-context";
import { buildPathFromState, buildStateFromPath } from "../entities/AppState";
import { AppRoute, buildRoutes } from "./AppRoute";

export const Router: React.FC<{ baseUrl: string }> = ({ baseUrl }) => {
    const { appState, routes, setAppState, reload } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();

    const routerRoutes = useMemo(() => buildRoutes(routes), [routes]);
    const element = useRoutes(routerRoutes);

    const [startPage] = useState(location.pathname);
    const defaultRoute = routes.find(({ defaultRoute }) => defaultRoute) ?? routes[0];

    const hasProperty = useCallback(
        (property: keyof AppRoute) => {
            const match = matchRoutes(routerRoutes, location.pathname);
            const path = match && match[0] ? match[0].route.path : "";
            const route = routes.find(({ paths }) => paths.includes(path));
            return route && route[property];
        },
        [routes, routerRoutes, location.pathname]
    );

    const mainComponent = useMemo(() => {
        return element ?? defaultRoute?.element;
    }, [appState, setAppState, element, defaultRoute]);

    // Update path on state change
    useEffect(() => {
        if (appState.type === "UNKNOWN") {
            return;
        } else {
            const path = buildPathFromState(appState);
            if (path !== location.pathname) navigate(path);
        }
    }, [appState, navigate, location, baseUrl]);

    // Load state with initial path
    useEffect(() => {
        const match = matchRoutes(routerRoutes, startPage);
        if (match) {
            setAppState(buildStateFromPath(match));
            reload();
        }
    }, [routerRoutes, startPage, setAppState, reload]);

    return <React.Fragment>{mainComponent}</React.Fragment>;
};
