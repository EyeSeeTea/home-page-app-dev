import {
    ConfirmationDialog,
    ConfirmationDialogProps,
    ObjectsTable,
    TableAction,
    TableColumn,
} from "@eyeseetea/d2-ui-components";
import { Icon } from "@material-ui/core";
import React, { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import i18n from "../../../utils/i18n";
import { NotificationContent } from "./NotificationContent";
import { NotificationViewModel } from "../../models/Notification";

export const NotificationListTable: React.FC<NotificationListTableProps> = props => {
    const { notifications, editNotification, deleteNotifications, isLoading } = props;
    const [confirmDeleteProps, setConfirmDeleteProps] = useState<ConfirmationDialogProps>();

    const rowConfig = useCallback((row: NotificationViewModel) => {
        return {
            selectable: row.canEdit,
        };
    }, []);

    const actions: TableAction<NotificationViewModel>[] = useMemo(
        () => [
            {
                name: "edit",
                text: i18n.t("Edit"),
                icon: <Icon>edit</Icon>,
                onClick: ids => {
                    const id = ids[0];
                    if (id) {
                        editNotification(id);
                    }
                },
                isActive: rows => {
                    return rows[0]?.canEdit || false;
                },
            },
            {
                name: "delete",
                text: i18n.t("Delete"),
                icon: <Icon>delete</Icon>,
                multiple: true,
                onClick: ids => {
                    setConfirmDeleteProps({
                        isOpen: true,
                        title: i18n.t("Delete notification"),
                        description: i18n.t("Are you sure you want to delete the selected notifications?"),
                        onCancel: () => setConfirmDeleteProps(undefined),
                        onSave: async () => {
                            setConfirmDeleteProps(undefined);
                            await deleteNotifications(ids);
                        },
                        saveText: i18n.t("Delete"),
                        cancelText: i18n.t("Cancel"),
                    });
                },
                isActive: rows => {
                    return rows.every(notification => notification.canEdit);
                },
            },
        ],
        [editNotification, deleteNotifications]
    );

    return (
        <PageWrapper>
            {confirmDeleteProps && <ConfirmationDialog {...confirmDeleteProps} />}
            <ObjectsTable<NotificationViewModel>
                rows={notifications}
                columns={columns}
                actions={actions}
                loading={isLoading}
                rowConfig={rowConfig}
            />
        </PageWrapper>
    );
};

type NotificationListTableProps = {
    notifications: NotificationViewModel[];
    editNotification: (notifId: string) => void;
    deleteNotifications: (notifIds: string[]) => Promise<void>;
    isLoading: boolean;
};

const columns: TableColumn<NotificationViewModel>[] = [
    { name: "content", text: i18n.t("Content"), getValue: item => <NotificationContent content={item.content} /> },
    {
        name: "recipients",
        text: i18n.t("Recipients"),
        getValue: item => (
            <>
                <p>
                    {[...item.recipients.users, ...item.recipients.userGroups]
                        .map(item => item.name ?? item.id)
                        .join(", ")}
                </p>
                <p>{item.recipients.wildcard}</p>
            </>
        ),
    },
    { name: "createdAt", text: i18n.t("Created At") },
    {
        name: "readBy",
        text: i18n.t("Read by"),
        getValue: item => item.readBy.map(item => item.name ?? item.id).join(", ") + String(item.canEdit),
    },
];

const PageWrapper = styled.div`
    .MuiTableRow-root {
        background: white;
    }
`;
