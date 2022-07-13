import React, { useCallback } from "react";
import styled from "styled-components";
import i18n from "../../../locales";
import { MainButton } from "../../components/main-button/MainButton";
import { MarkdownViewer } from "../../components/markdown-viewer/MarkdownViewer";
import { Modal, ModalContent, ModalFooter } from "../../components/modal";
import { useAppContext } from "../../contexts/app-context";

export const WelcomePage = () => {
    const { setAppState, action: module, translate } = useAppContext();

    const startTutorial = useCallback(() => {
        if (!module) return;
        setAppState({ type: "TRAINING_DIALOG", dialog: "contents", module: module.id });
    }, [module, setAppState]);

    const goHome = useCallback(() => {
        setAppState({ type: "HOME" });
    }, [setAppState]);

    if (!module) return null;

    return (
        <StyledModal onGoHome={goHome} centerChildren={true}>
            <WelcomePageContent welcome="" />
            <ModalFooter>
                <MainButton color="secondary">{i18n.t("Exit Tutorial")}</MainButton>
                <MainButton color="primary" onClick={startTutorial}>
                    {i18n.t("Start Tutorial")}
                </MainButton>
            </ModalFooter>
        </StyledModal>
    );
};

const StyledModal = styled(Modal)`
    ${ModalContent} {
        padding-top: 25px;
        height: 100%;
        max-height: unset;
    }
`;

export const WelcomePageContent: React.FC<{ welcome: string }> = ({ welcome }) => {
    return (
        <ModalContent>
            <MarkdownViewer source={welcome} center={true} />
        </ModalContent>
    );
};
