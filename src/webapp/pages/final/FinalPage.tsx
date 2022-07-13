import React, { useCallback, useEffect } from "react";
import styled from "styled-components";
import i18n from "../../../locales";
//import Decoration from "../../assets/Decoration.png";
import { MainButton } from "../../components/main-button/MainButton";
import { Modal, ModalContent, ModalFooter, ModalParagraph, ModalTitle } from "../../components/modal";
import { useAppContext } from "../../contexts/app-context";

export const FinalPage: React.FC = () => {
    const { usecases, setAppState, action, translate } = useAppContext();

    const openSummary = useCallback(() => {
        setAppState(appState => {
            if (appState.type !== "TRAINING_DIALOG") return appState;
            return { type: "TRAINING_DIALOG", module: appState.module, dialog: "summary" };
        });
    }, [setAppState]);

    // const goToLastTutorialStep = useCallback(() => {
    //     if (!module) return;
    //     const step = module.contents.steps.length;
    //     const content = module.contents.steps[step - 1]?.pages.length ?? 0;

    //     setAppState({
    //         type: "TRAINING",
    //         state: "OPEN",
    //         module: module.id,
    //         step,
    //         content,
    //     });
    // }, [setAppState, module]);

    const goHome = useCallback(() => {
        setAppState({ type: "HOME" });
    }, [setAppState]);

    const movePage = useCallback(
        (step: number, content: number) => {
            setAppState(appState => {
                if (appState.type !== "TRAINING") return appState;
                return { ...appState, step, content };
            });
        },
        [setAppState]
    );

    // useEffect(() => {
    //     if (module) usecases.progress.complete(module.id);
    // }, [module, usecases]);

    // if (!module) return null;

    // const steps = module.contents.steps.map(({ title }, idx) => ({
    //     key: `step-${idx}`,
    //     label: translate(title),
    //     component: () => null,
    // }));

    return (
        <StyledModal onGoHome={goHome} centerChildren={true}>
            <ModalContent bigger={true}>
                <Container>
                    <ModalTitle big={true}>{i18n.t("Well done!")}</ModalTitle>
                    <ModalParagraph>
                        {i18n.t("You've completed the {{name}} tutorial!", {
                            name: action?.name,
                        })}
                    </ModalParagraph>
                    {/* <Stepper steps={steps} lastClickableStepIndex={-1} markAllCompleted={true} onMove={movePage} /> */}
                    <ModalFooter>
                        {/* <MainButton onClick={goToLastTutorialStep}>{i18n.t("Back to tutorial")}</MainButton> */}
                        <MainButton onClick={openSummary}>{i18n.t("Finish")}</MainButton>
                    </ModalFooter>
                </Container>
            </ModalContent>
        </StyledModal>
    );
};

const StyledModal = styled(Modal)`
    background-position: center; /* Center the image */
    background-repeat: no-repeat; /* Do not repeat the image */
    height: 600px;

    ${ModalContent} {
        max-height: unset;
    }

    ${ModalTitle} {
        font-size: 60px;
    }

    ${ModalParagraph} {
        font-size: 34px;
        line-height: 42px;
        font-weight: 300;
        margin: 25px 0px 15px 0px;
    }

    ${ModalFooter} {
        margin-top: 20px;
    }
`;

const Container = styled.div`
    margin: 12% 18% 0 18%;
`;
