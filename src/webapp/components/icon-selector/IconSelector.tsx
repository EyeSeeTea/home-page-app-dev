import React, { ChangeEvent } from "react";
import { Maybe } from "../../../types/utils";
import { imagesMimeType } from "../../../utils/files";
import styled from "styled-components";

type IconSelectorProps = {
    icon: string;
    onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
    onClear: () => void;
    accept?: Maybe<string>;
    alt?: string;
};

export const IconSelector = (props: IconSelectorProps) => {
    const { icon, onUpload, onClear, alt } = props;
    return (
        <IconUpload>
            {icon ? (
                <IconContainer>
                    <img src={icon} alt={alt} />
                    <ClearButton onClick={onClear}>✕</ClearButton>
                </IconContainer>
            ) : null}

            <FileInput type="file" onChange={onUpload} accept={imagesMimeType} />
        </IconUpload>
    );
};

const IconUpload = styled.div`
    display: flex;
    align-items: center;
`;

const IconContainer = styled.div`
    position: relative;
    margin-right: 60px;
    flex-shrink: 0;

    img {
        height: 150px;
        margin: 0;
        user-drag: none;
    }
`;

const ClearButton = styled.button`
    position: absolute;
    top: -13px;
    right: -13px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 14px;
    line-height: 18px;
    text-align: center;
    cursor: pointer;
    padding: 0;

    &:hover {
        background: rgba(0, 0, 0, 0.8);
    }
`;

const FileInput = styled.input`
    outline: none;
`;
