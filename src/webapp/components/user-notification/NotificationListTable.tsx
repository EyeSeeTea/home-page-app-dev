import { ObjectsTable, TableAction, TableColumn, TableSelection, TableState } from "@eyeseetea/d2-ui-components";
import { Icon } from "@material-ui/core";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import i18n from "../../../utils/i18n";
import { useAppContext } from "../../contexts/app-context";
import { Notification } from "../../../domain/entities/Notification";
import { NotificationContent } from "./NotificationContent";

const columns: TableColumn<Notification>[] = [
    { name: "content", text: i18n.t("Content"), getValue: item => <NotificationContent content={item.content} /> },
    {
        name: "recipients",
        text: i18n.t("Recipients"),
        getValue: item =>
            [...item.recipients.users, ...item.recipients.userGroups].map(item => item.name ?? item.id).join(", "),
    },
    { name: "createdAt", text: i18n.t("Created At") },
    {
        name: "readBy",
        text: i18n.t("Read by"),
        getValue: item => item.readBy.map(item => item.name ?? item.id).join(", "),
    },
];

export const NotificationListTable: React.FC = () => {
    const { compositionRoot, reload } = useAppContext();
    // const [notifDetailsDialog, setNotifDetailsDialog] = useState<>();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [selection, setSelection] = useState<TableSelection[]>([]);

    const actions: TableAction<Notification>[] = useMemo(
        () => [
            {
                name: "edit",
                text: i18n.t("Edit"),
                icon: <Icon>edit</Icon>,
                onClick: ids => {
                    const notification = notifications.find(({ id }) => id === ids[0]);
                    if (!notification) return;

                    // setNotifDetailsDialog({
                    //     initialNotification: { ...notification, readBy: [] },
                    //     onClose: () => setCreateDialogProps(undefined),
                    //     onSave: async notification => {
                    //         await compositionRoot.notifications.save([notification]);
                    //         reload();
                    //     },
                    // });
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
                    // reload();
                },
            },
        ],
        [compositionRoot, reload, notifications]
    );

    const onChange = useCallback((state: TableState<Notification>) => {
        setSelection(state.selection);
    }, []);

    useEffect(() => {
        compositionRoot.notifications
            .get()
            .toPromise()
            .then(notifications => setNotifications(notifications));
    }, [compositionRoot]);

    return (
        <PageWrapper>
            {/*{createDialogProps ? <NotificationDetailsDialog {...notifDetailsDialog} /> : null}*/}

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
