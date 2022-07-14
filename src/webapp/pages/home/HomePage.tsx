import React, { useCallback, useEffect, useMemo, useState } from "react";
import _ from "lodash";
import CircularProgress from "material-ui/CircularProgress";
import styled from "styled-components";

import { LandingNode } from "../../../domain/entities/LandingNode";
import i18n from "../../../locales";
import { BigCard } from "../../components/card-board/BigCard";
import { Cardboard } from "../../components/card-board/Cardboard";
import { MarkdownViewer } from "../../components/markdown-viewer/MarkdownViewer";
import { Modal, ModalContent, ModalParagraph, ModalTitle } from "../../components/modal";
import { useAppContext } from "../../contexts/app-context";

const Item: React.FC<{
    currentPage: LandingNode;
    isRoot: boolean;
    openPage: (page: LandingNode) => void;
}> = props => {
    const { currentPage, openPage } = props;
    const { translate } = useAppContext();
    const { logoPath, logoText } = React.useMemo(getLogoInfo, []);

    if (currentPage.type === "root") {
        return (
            <React.Fragment>
                <LogoContainer>
                    <img src={logoPath} alt={logoText} />
                </LogoContainer>
                <ModalTitle bold={true} big={true}>
                    {i18n.t("Welcome to Home Page App")}
                </ModalTitle>

                <ModalContent>
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
                </ModalContent>
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

                    <ModalTitle>{translate(currentPage.title ?? currentPage.name)}</ModalTitle>
                </Header>

                <ModalContent>
                    {currentPage.content ? <MarkdownContents source={translate(currentPage.content)} /> : null}
                    {currentPage.children.map(node => (
                        <Item key={`node-${node.id}`} {...props} currentPage={node} />
                    ))}
                    <AdditionalComponents currentPage={currentPage} isRoot={props.isRoot} />
                </ModalContent>
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

                    <ModalTitle>{translate(currentPage.title ?? currentPage.name)}</ModalTitle>
                </Header>

                <ModalContent>
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
                </ModalContent>
            </GroupContainer>
        );
    }

    return null;
};

const AdditionalComponents: React.FC<{
    isRoot: boolean;
    currentPage: LandingNode;
}> = ({ isRoot, currentPage }) => {
    const { actions, translate, showAllActions, launchAppBaseUrl } = useAppContext();

    const pageActions = isRoot && showAllActions ? actions.map(({ id }) => id) : currentPage?.actions ?? [];

    return (
        <React.Fragment>
            {isRoot && showAllActions ? (
                <ModalParagraph size={28} align={"left"}>
                    {i18n.t("Available actions:")}
                </ModalParagraph>
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
    const { setAppState, hasSettingsAccess, landings, reload, isLoading } = useAppContext();

    const [history, updateHistory] = useState<LandingNode[]>([]);
    const [isLoadingLong, setLoadingLong] = useState<boolean>(false);

    const openSettings = useCallback(() => {
        setAppState({ type: "SETTINGS" });
    }, [setAppState]);

    const openAbout = useCallback(() => {
        setAppState({ type: "ABOUT" });
    }, [setAppState]);

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
        <StyledModal
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
        </StyledModal>
    );
});

const ProgressContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
`;

const StyledModal = styled(Modal)`
    min-height: 100vh;
    background-color: #276696;
    ${ModalContent} {
        padding: 0px;
        margin: 0px 10px 20px 10px;
    }

    ${ModalTitle} {
        margin: 20px;
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

function getLogoInfo() {
    const logoPath = process.env["REACT_APP_LOGO_PATH"] || "img/logo-eyeseetea.png";
    const filename = logoPath.split("/").reverse()[0] || "";
    const name = filename.substring(0, filename.lastIndexOf("."));
    const logoText = _.startCase(name);
    return { logoPath, logoText };
}