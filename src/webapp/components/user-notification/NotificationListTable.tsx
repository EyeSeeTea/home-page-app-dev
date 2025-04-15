import { ObjectsTable, TableAction, TableColumn, TableSelection, TableState } from "@eyeseetea/d2-ui-components";
import { Icon } from "@material-ui/core";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import i18n from "../../../utils/i18n";
import { useAppContext } from "../../contexts/app-context";
import { Notification } from "../../../domain/entities/Notification";
import { NotificationContent } from "./NotificationContent";
import { NotificationDetailsDialog, NotificationDetailsDialogProps } from "./NotificationDetailsDialog";

const columns: TableColumn<Notification>[] = [
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
        getValue: item => item.readBy.map(item => item.name ?? item.id).join(", "),
    },
];

export const NotificationListTable: React.FC = () => {
    const { compositionRoot } = useAppContext();
    const [notifDetailsDialog, setNotifDetailsDialog] = useState<NotificationDetailsDialogProps>();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [selection, setSelection] = useState<TableSelection[]>([]);

    const fetchNotifications = useCallback(
        () =>
            compositionRoot.notifications
                .get()
                .toPromise()
                .then(notifications => setNotifications(notifications)),
        [compositionRoot]
    );

    const actions: TableAction<Notification>[] = useMemo(
        () => [
            {
                name: "edit",
                text: i18n.t("Edit"),
                icon: <Icon>edit</Icon>,
                onClick: ids => {
                    const notification = notifications.find(({ id }) => id === ids[0]);
                    if (!notification) return;

                    setNotifDetailsDialog({
                        initialNotification: { ...notification, readBy: [] },
                        onClose: () => setNotifDetailsDialog(undefined),
                        onSave: notification =>
                            compositionRoot.notifications
                                .save([notification])
                                .toPromise()
                                .finally(() => fetchNotifications()),
                    });
                },
            },
            {
                name: "delete",
                text: i18n.t("Delete"),
                icon: <Icon>delete</Icon>,
                multiple: true,
                onClick: async ids => {
                    // await compositionRoot.notifications.delete(ids);
                    setSelection([]);
                    // reloadNotifications();
                },
            },
        ],
        [compositionRoot, fetchNotifications, notifications]
    );

    const onChange = useCallback((state: TableState<Notification>) => {
        setSelection(state.selection);
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return (
        <PageWrapper>
            {notifDetailsDialog ? <NotificationDetailsDialog {...notifDetailsDialog} /> : null}

            <ObjectsTable<Notification>
                rows={notifications}
                columns={columns}
                actions={actions}
                // onActionButtonClick={notificationDetails}
                selection={selection}
                onChange={onChange}
            />
        </PageWrapper>
    );
};

const PageWrapper = styled.div`
    .MuiTableRow-root {
        background: white;
    }
`;
