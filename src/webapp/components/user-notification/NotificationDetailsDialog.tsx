import { ConfirmationDialog, Sharing, Dropdown, DropdownItem } from "@eyeseetea/d2-ui-components";
import React from "react";
import ReactMde from "react-mde";
import styled from "styled-components";

import { Notification, NotificationWildcard } from "../../../domain/entities/Notification";
import i18n from "../../../utils/i18n";
import { useNotificationDetailsDialog } from "./useNotificationDetailsDialog";
import { Box } from "@material-ui/core";

export const NotificationDetailsDialog: React.FC<NotificationDetailsDialogProps> = props => {
    const { onClose, initialNotification, isLoading } = props;
    const title = initialNotification ? i18n.t("Edit Notification") : i18n.t("Create new notification");

    const {
        handleSave,
        notification,
        onContentChange,
        onSharingChanged,
        onWildcardChange,
        searchSharing,
        sharingMeta,
    } = useNotificationDetailsDialog(props);

    return (
        <ConfirmationDialog
            open={true}
            fullWidth={true}
            onCancel={onClose}
            onSave={handleSave}
            title={title}
            maxWidth={"md"}
            disableSave={isLoading}
            saveText={isLoading ? i18n.t("Saving...") : i18n.t("Save")}
        >
            <ReactMde
                value={notification.content}
                onChange={onContentChange}
                minEditorHeight={200}
                disablePreview={true}
            />

            <Sharing
                subtitle={i18n.t("Recipients")}
                meta={sharingMeta}
                showOptions={sharingOptions}
                onSearch={searchSharing}
                onChange={onSharingChanged}
            />

            <Row>
                <Dropdown
                    label={i18n.t("Wildcard")}
                    items={wildCardOptions}
                    onChange={onWildcardChange}
                    value={notification.recipients.wildcard}
                />
            </Row>
        </ConfirmationDialog>
    );
};

export type NotificationDetailsDialogProps = {
    onClose: () => void;
    onSave: (notification: Notification) => Promise<void>;
    initialNotification?: Notification;
    isLoading?: boolean;
};

const sharingOptions = {
    title: false,
    dataSharing: false,
    publicSharing: false,
    externalSharing: false,
    permissionPicker: false,
};

const wildCardOptions: DropdownItem[] = Object.values(NotificationWildcard).map(wildcard => ({
    value: wildcard,
    text: wildcard,
}));

const Row = styled(Box)`
    margin-top: 2em;
`;
