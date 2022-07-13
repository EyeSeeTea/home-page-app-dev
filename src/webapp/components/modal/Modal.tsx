import React from "react";
import styled from "styled-components";
import { ModalHeader, ModalHeaderProps } from "./ModalHeader";

export const Modal: React.FC<ModalProps> = ({
    className,
    children,
    onGoHome,
    onGoBack,
    onSettings,
    onAbout,
    centerChildren,
}) => {
    return (
        <ModalWrapper center={centerChildren}>
            <ModalBody className={className}>
                <ModalHeader onGoHome={onGoHome} onGoBack={onGoBack} onSettings={onSettings} onAbout={onAbout} />
                {children}
            </ModalBody>
        </ModalWrapper>
    );
};

export interface ModalProps extends ModalHeaderProps {
    className?: string;
    centerChildren?: boolean;
}

const ModalWrapper = styled.div<{ center?: boolean }>`
    justify-content: center;
    align-items: center;
    text-align: ${props => (props.center ? "center" : "unset")};
    user-select: none;
`;

export const ModalBody = styled.div`
    background-color: #276696;
    padding: 18px;
    font-family: "Roboto", sans-serif;
    color: #fff;
    pointer-events: auto;
`;
