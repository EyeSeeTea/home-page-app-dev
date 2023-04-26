import React, { useCallback, useEffect, useMemo, useState } from "react";
import CircularProgress from "material-ui/CircularProgress";
import styled from "styled-components";

import { LandingNode } from "../../../domain/entities/LandingNode";
import i18n from "../../../locales";
import { LandingLayout, LandingContent } from "../../components/landing-layout";
import { useAppContext } from "../../contexts/app-context";
import { useNavigate } from "react-router-dom";
import { Item } from "../../components/item/Item";
import { useConfig } from "../settings/useConfig";
import { Cardboard } from "../../components/card-board/Cardboard";
import { BigCard } from "../../components/card-board/BigCard";
import _ from "lodash";

export const HomePage: React.FC = React.memo(() => {
    const { hasSettingsAccess, landings, reload, isLoading, launchAppBaseUrl, translate } = useAppContext();
    const { defaultApplication, landingPagePermissions, user } = useConfig();

    const userLandings = useMemo<LandingNode[] | undefined>(() => {
        return landings && landingPagePermissions
            ? _.compact(
                  landingPagePermissions?.map(landingPagePermission =>
                      landingPagePermission.users?.some(u => u.id === user?.id) ||
                      landingPagePermission.userGroups?.some(
                          ug => !!user?.userGroups.find(userGroup => userGroup.id === ug.id)
                      )
                          ? landings.find(
                                landing =>
                                    landing.id === landingPagePermission.id ||
                                    //  i tried this first
                                    landing.children.map(child => child.id).includes(landingPagePermission.id)
                            )
                          : undefined
                  )
              )
            : undefined;
    }, [landingPagePermissions, landings, user]);

    // then i tried this
    // Create a map of page IDs to page objects
    const pageMap = _.keyBy(landings, "id");

    // Find the IDs of all pages accessible to the user
    const accessiblePageIds = _.flatMap(
        _.compact(
            _.intersection(
                // IDs of pages accessible to any user group the user belongs to
                user?.userGroups.map(
                    userGroup =>
                        landingPagePermissions
                            ?.filter(permission => permission?.userGroups?.some(g => g.id === userGroup.id))
                            .map(permission => permission.id), // IDs of pages accessible to the user directly
                    // IDs of pages accessible to the user directly
                    landingPagePermissions
                        ?.filter(permission => permission?.users?.some(u => u.id === user?.id))
                        .map(permission => permission.id)
                )
            )
        )
    );

    // Return a new array of accessible pages with inaccessible children removed
    const accessiblePages = accessiblePageIds.map(id => {
        const page = pageMap[id];
        return {
            id,
            children: page?.children.filter(child => accessiblePageIds.includes(child.id)),
        };
    });

    const navigate = useNavigate();
    const [history, updateHistory] = useState<LandingNode[]>([]);
    const [isLoadingLong, setLoadingLong] = useState<boolean>(false);
    const [pageType, setPageType] = useState<"userLandings" | "singleLanding">("singleLanding");

    const currentPage = useMemo<LandingNode | undefined>(() => {
        return history[0] ?? userLandings?.[0];
    }, [history, userLandings]);

    const isRoot = history.length === 0;

    const openSettings = useCallback(() => {
        navigate("/settings");
    }, [navigate]);

    const openAbout = useCallback(() => {
        navigate("/about");
    }, [navigate]);

    const openPage = useCallback((page: LandingNode) => {
        updateHistory(history => [page, ...history]);
    }, []);

    const goBack = useCallback(() => {
        if (userLandings?.length === 1 || currentPage?.type !== "root") updateHistory(history => history.slice(1));
        else setPageType("userLandings");
    }, [currentPage, userLandings]);

    const goHome = useCallback(() => {
        if (userLandings?.length === 1) updateHistory([]);
        else setPageType("userLandings");
    }, [userLandings?.length]);

    const logout = useCallback(() => {
        window.location.href = `${launchAppBaseUrl}/dhis-web-commons-security/logout.action`;
    }, [launchAppBaseUrl]);

    useEffect(() => {
        reload();
    }, [reload]);

    useEffect(() => {
        setTimeout(function () {
            setLoadingLong(true);
        }, 8000);
    }, []);

    useEffect(() => {
        if (userLandings?.length === 0) {
            window.location.href = !defaultApplication
                ? `${launchAppBaseUrl}/dhis-web-dashboard/index.html`
                : `${launchAppBaseUrl}${defaultApplication}`;
        }
        if (userLandings && userLandings?.length > 1) {
            setPageType("userLandings");
        }
    }, [defaultApplication, isLoadingLong, launchAppBaseUrl, userLandings]);

    return (
        <StyledLanding
            backgroundColor={currentPage?.backgroundColor}
            onSettings={hasSettingsAccess ? openSettings : undefined}
            onAbout={openAbout}
            onGoBack={!isRoot && pageType === "singleLanding" ? goBack : undefined}
            onGoHome={!isRoot && pageType === "singleLanding" ? goHome : undefined}
            onLogout={logout}
            centerChildren={true}
        >
            <ContentWrapper>
                {isLoading ? (
                    <ProgressContainer>
                        <CircularProgress color={"white"} size={65} />
                        {isLoadingLong ? (
                            <p>{i18n.t("First load can take a couple of minutes, please wait...")}</p>
                        ) : null}
                    </ProgressContainer>
                ) : userLandings && pageType === "userLandings" ? (
                    <>
                        <h1>Available Home Pages</h1>
                        <Cardboard rowSize={4}>
                            {userLandings?.map(landing => {
                                return (
                                    <BigCard
                                        key={`card-${landing.id}`}
                                        label={translate(landing.name)}
                                        onClick={() => {
                                            openPage(landing);
                                            setPageType("singleLanding");
                                        }}
                                        icon={
                                            landing.icon ? (
                                                <img src={landing.icon} alt={`Icon for ${translate(landing.name)}`} />
                                            ) : undefined
                                        }
                                    />
                                );
                            })}
                        </Cardboard>
                    </>
                ) : currentPage && pageType === "singleLanding" ? (
                    <Item isRoot={isRoot} currentPage={currentPage} openPage={openPage} />
                ) : null}
            </ContentWrapper>
        </StyledLanding>
    );
});

const ProgressContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 80vh;
`;

const StyledLanding = styled(LandingLayout)`
    ${LandingContent} {
        padding: 0px;
        margin: 0px 10px 20px 10px;
    }
`;

const ContentWrapper = styled.div`
    padding: 15px;
    min-height: 100vh;
`;
