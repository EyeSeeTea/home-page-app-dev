import React, { useEffect, useRef } from "react";
import { Route, Routes, HashRouter } from "react-router-dom";
import { AboutPage } from "../pages/about/AboutPage";
import { ActionDetailPage } from "../pages/action-detail/ActionDetailPage";
import { HomePage } from "../pages/home/HomePage";
import { SettingsPage } from "../pages/settings/SettingsPage";

export const Router: React.FC = React.memo(() => {
    return (
        <HashRouter>
            <Routes>
                <Route
                    path="/settings"
                    element={
                        <PageWithFavicon>
                            <SettingsPage />
                        </PageWithFavicon>
                    }
                />
                <Route
                    path="/about"
                    element={
                        <PageWithFavicon>
                            <AboutPage />
                        </PageWithFavicon>
                    }
                />
                <Route path="/actions">
                    <Route
                        path="new"
                        element={
                            <PageWithFavicon>
                                <ActionDetailPage mode="new" />
                            </PageWithFavicon>
                        }
                    />
                    <Route
                        path="edit/:id"
                        element={
                            <PageWithFavicon>
                                <ActionDetailPage mode="edit" />
                            </PageWithFavicon>
                        }
                    />
                    <Route
                        path="clone/:id"
                        element={
                            <PageWithFavicon>
                                <ActionDetailPage mode="clone" />
                            </PageWithFavicon>
                        }
                    />
                </Route>

                <Route path="/" element={<HomePage />} />
            </Routes>
        </HashRouter>
    );
});

const PageWithFavicon: React.FC = React.memo(props => {
    const favicon = useRef<HTMLLinkElement>(document.head.querySelector('link[rel="icon"]'));

    useEffect(() => {
        favicon.current?.setAttribute("href", defaultIcon);
        document.title = defaultTitle;
    }, []);

    return <>{props.children}</>;
});

export const defaultIcon = process.env.PUBLIC_URL + "/icon-small.png";
export const defaultTitle = "Homepage App";
