import { ConfirmationDialog, ConfirmationDialogProps } from "@eyeseetea/d2-ui-components";
import _ from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { defaultAction, PartialAction } from "../../../domain/entities/Action";
import i18n from "../../../locales";
import { ActionCreationWizard } from "../../components/action-creation-wizard/ActionCreationWizard";
import { PageHeader } from "../../components/page-header/PageHeader";
import { useAppContext } from "../../contexts/app-context";
import { DhisLayout } from "../../components/dhis-layout/DhisLayout";

export interface EditPageProps {
    mode: "create" | "edit" | "clone";
}

const getClonedAction = (action: PartialAction): PartialAction => {
    const id = `${action.id}-copy`;
    const referenceValue = `Copy of ${action.name.referenceValue}`;

    return {
        ...action,
        id,
        name: { key: id, referenceValue, translations: {} },
    };
};

export const EditPage: React.FC<EditPageProps> = ({ mode = "create" }) => {
    const { action, setAppState, usecases, reload } = useAppContext();

    const [stateAction, updateStateAction] = useState<PartialAction>(action ?? defaultAction);
    const [dialogProps, updateDialog] = useState<ConfirmationDialogProps | null>(null);
    const [dirty, setDirty] = useState<boolean>(false);

    const openSettings = useCallback(() => {
        setAppState({ type: "SETTINGS" });
    }, [setAppState]);

    const saveAction = useCallback(async () => {
        //await usecases.actions.update({ ...stateAction, id: _.kebabCase(stateAction.id) });
        await usecases.actions.update({ ...stateAction, id: _.kebabCase(stateAction.id) });
        await reload();
    }, [stateAction, usecases, reload]);

    const onChange = useCallback((update: Parameters<typeof updateStateAction>[0]) => {
        updateStateAction(update);
        setDirty(true);
    }, []);

    const onCancel = useCallback(() => {
        if (!dirty) {
            openSettings();
            return;
        }

        const dialogTitles = {
            edit: i18n.t("Cancel action editing?"),
            clone: i18n.t("Cancel action cloning?"),
            create: i18n.t("Cancel action creation?"),
        };

        updateDialog({
            title: dialogTitles[mode],
            description: i18n.t("All your changes will be lost. Are you sure you want to proceed?"),
            saveText: i18n.t("Yes"),
            cancelText: i18n.t("No"),
            onSave: openSettings,
            onCancel: () => updateDialog(null),
        });
    }, [dirty, openSettings, mode]);

    useEffect(() => {
        if (action) updateStateAction(mode === "clone" ? getClonedAction(action) : action);
    }, [action, mode]);

    const titles = {
        edit: i18n.t("Edit action"),
        clone: i18n.t("Clone action"),
        create: i18n.t("New action"),
    };

    return (
        <DhisLayout>
            <Header title={titles[mode]} onBackClick={onCancel} />

            {dialogProps && <ConfirmationDialog isOpen={true} maxWidth={"xl"} {...dialogProps} />}

            {stateAction ? (
                <Wizard
                    isEdit={mode === "edit"}
                    onChange={onChange}
                    onCancel={onCancel}
                    onClose={openSettings}
                    onSave={saveAction}
                    action={stateAction}
                />
            ) : null}
        </DhisLayout>
    );
};

const Header = styled(PageHeader)`
    margin-top: 1rem;
`;

const Wizard = styled(ActionCreationWizard)`
    margin: 1rem;
`;
