import React, { useCallback, useEffect, useMemo, useState } from "react";
import _ from "lodash";
import CircularProgress from "material-ui/CircularProgress";
import styled from "styled-components";

import { LandingNode } from "../../../domain/entities/LandingNode";
import i18n from "../../../locales";
import { BigCard } from "../../components/card-board/BigCard";
import { Cardboard } from "../../components/card-board/Cardboard";
import { MarkdownViewer } from "../../components/markdown-viewer/MarkdownViewer";
import { LandingLayout, LandingContent, LandingParagraph, LandingTitle } from "../../components/landing-layout";
import { useAppContext } from "../../contexts/app-context";
import { useNavigate } from "react-router-dom";
import { useConfig } from "../settings/useConfig";

const Item: React.FC<{
    currentPage: LandingNode;
    isRoot: boolean;
    openPage: (page: LandingNode) => void;
}> = props => {
    const { currentPage, openPage } = props;
    const { translate } = useAppContext();
    const logoText = React.useMemo(() => getLogoText(currentPage.icon), [currentPage.icon]);

    if (currentPage.type === "root") {
        return (
            <React.Fragment>
                <LogoContainer>
                    <img src={currentPage.icon} alt={logoText} />
                </LogoContainer>
                <LandingTitle bold={true} big={true}>
                    {translate(currentPage.title ?? currentPage.name)}
                </LandingTitle>

                <LandingContent>
                    <Cardboard rowSize={4} key={`group-${currentPage.id}`}>
                        {currentPage.children.map((item, idx) => {
                            return (
                                <BigCard
                                    key={`card-${idx}`}
                                    label={translate(item.name)}
                                    onClick={() => openPage(item)}
                                    icon={
                                        item.icon ? (
                                            <img src={item.icon} alt={`Icon for ${translate(item.name)}`} />
                                        ) : undefined
                                    }
                                />
                            );
                        })}
                    </Cardboard>

                    <AdditionalComponents currentPage={currentPage} isRoot={props.isRoot} />
                </LandingContent>
            </React.Fragment>
        );
    }

    if (currentPage.type === "section") {
        return (
            <GroupContainer>
                <Header>
                    {currentPage.icon ? (
                        <IconContainer>
                            <img src={currentPage.icon} alt={`Page icon`} />
                        </IconContainer>
                    ) : null}

                    <LandingTitle>{translate(currentPage.title ?? currentPage.name)}</LandingTitle>
                </Header>

                <LandingContent>
                    {currentPage.content ? <MarkdownContents source={translate(currentPage.content)} /> : null}
                    {currentPage.children.map(node => (
                        <Item key={`node-${node.id}`} {...props} currentPage={node} />
                    ))}
                    <AdditionalComponents currentPage={currentPage} isRoot={props.isRoot} />
                </LandingContent>
            </GroupContainer>
        );
    }

    if (currentPage.type === "sub-section") {
        return (
            <GroupContainer>
                <GroupTitle>{translate(currentPage.title ?? currentPage.name)}</GroupTitle>

                {currentPage.content ? <MarkdownContents source={translate(currentPage.content)} /> : null}

                <Cardboard rowSize={5} key={`group-${currentPage.id}`}>
                    {currentPage.children.map((item, idx) => {
                        return (
                            <BigCard
                                key={`card-${idx}`}
                                label={translate(item.name)}
                                onClick={() => openPage(item)}
                                icon={
                                    item.icon ? (
                                        <img src={item.icon} alt={`Icon for ${translate(item.name)}`} />
                                    ) : undefined
                                }
                            />
                        );
                    })}
                </Cardboard>

                <AdditionalComponents currentPage={currentPage} isRoot={props.isRoot} />
            </GroupContainer>
        );
    }

    if (currentPage.type === "category") {
        return (
            <GroupContainer>
                <Header>
                    {currentPage.icon ? (
                        <IconContainer>
                            <img src={currentPage.icon} alt={`Page icon`} />
                        </IconContainer>
                    ) : null}

                    <LandingTitle>{translate(currentPage.title ?? currentPage.name)}</LandingTitle>
                </Header>

                <LandingContent>
                    {currentPage.content ? <MarkdownContents source={translate(currentPage.content)} /> : null}
                    <Cardboard rowSize={5} key={`group-${currentPage.id}`}>
                        {currentPage.children.map((item, idx) => {
                            return (
                                <BigCard
                                    key={`card-${idx}`}
                                    label={translate(item.name)}
                                    onClick={() => openPage(item)}
                                    icon={
                                        item.icon ? (
                                            <img src={item.icon} alt={`Icon for ${translate(item.name)}`} />
                                        ) : undefined
                                    }
                                />
                            );
                        })}
                    </Cardboard>

                    <AdditionalComponents currentPage={currentPage} isRoot={props.isRoot} />
                </LandingContent>
            </GroupContainer>
        );
    }

    return null;
};

const AdditionalComponents: React.FC<{
    isRoot: boolean;
    currentPage: LandingNode;
}> = ({ isRoot, currentPage }) => {
    const { actions, translate, launchAppBaseUrl } = useAppContext();

    const { showAllActions } = useConfig();

    const pageActions = isRoot && showAllActions ? actions.map(({ id }) => id) : currentPage?.actions ?? [];

    return (
        <React.Fragment>
            {isRoot && showAllActions ? (
                <LandingParagraph size={28} align={"left"}>
                    {i18n.t("Available actions:")}
                </LandingParagraph>
            ) : null}

            <Cardboard rowSize={4} key={`group-${currentPage.id}`}>
                {pageActions.map(actionId => {
                    const action = actions.find(({ id }) => id === actionId);
                    if (!action || !action.compatible) return null;

                    const handleClick = () => {
                        window.location.href = `${launchAppBaseUrl}${action.dhisLaunchUrl}`;
                    };

                    const name = translate(action.name);

                    return (
                        <BigCard
                            key={`card-${actionId}`}
                            label={name}
                            onClick={handleClick}
                            disabled={action?.disabled}
                            icon={action?.icon ? <img src={action.icon} alt={`Icon for ${name}`} /> : undefined}
                        />
                    );
                })}
            </Cardboard>
        </React.Fragment>
    );
};

export const HomePage: React.FC = React.memo(() => {
    const { hasSettingsAccess, landings, reload, isLoading } = useAppContext();
    const navigate = useNavigate();

    const [history, updateHistory] = useState<LandingNode[]>([]);
    const [isLoadingLong, setLoadingLong] = useState<boolean>(false);

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
        updateHistory(history => history.slice(1));
    }, []);

    const goHome = useCallback(() => {
        updateHistory([]);
    }, []);

    const currentPage = useMemo<LandingNode | undefined>(() => {
        return history[0] ?? landings[0];
    }, [history, landings]);

    const isRoot = history.length === 0;

    useEffect(() => {
        reload();
    }, [reload]);

    useEffect(() => {
        setTimeout(function () {
            setLoadingLong(true);
        }, 8000);
    }, []);

    return (
        <StyledLanding
            onSettings={hasSettingsAccess ? openSettings : undefined}
            onAbout={openAbout}
            onGoBack={!isRoot ? goBack : undefined}
            onGoHome={!isRoot ? goHome : undefined}
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
                ) : currentPage ? (
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
    height: 100vh;
`;

const StyledLanding = styled(LandingLayout)`
    ${LandingContent} {
        padding: 0px;
        margin: 0px 10px 20px 10px;
    }
`;

const ContentWrapper = styled.div`
    padding: 15px;
`;

const LogoContainer = styled.div`
    margin-top: 15px;

    img {
        margin: 0 30px;
        user-drag: none;
        max-height: 100px;
    }
`;

const IconContainer = styled.div`
    background: #6d98b8;
    margin-right: 30px;
    border-radius: 50%;
    flex-shrink: 0;
    height: 12vh;
    width: 12vh;
    display: flex;
    align-items: center;

    img {
        width: 100%;
        height: auto;
        user-drag: none;
    }
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    font-size: 36px;
    line-height: 47px;
    font-weight: 300;
    margin: 40px 0px 30px 50px;
`;

const GroupContainer = styled.div`
    margin-bottom: 20px;
`;

const GroupTitle = styled.span`
    display: block;
    text-align: left;
    font-size: 32px;
    line-height: 47px;
    font-weight: 700;
`;

const MarkdownContents = styled(MarkdownViewer)`
    padding: 0;

    h1 {
        display: block;
        text-align: left;
        font-size: 32px;
        line-height: 47px;
        font-weight: 700;
        margin: 0;
    }

    h2 {
        text-align: left;
    }
`;

function getLogoText(logoPath: string) {
    const filename = logoPath.split("/").reverse()[0] || "";
    const name = filename.substring(0, filename.lastIndexOf("."));
    const logoText = _.startCase(name);
    return logoText;
}
