import { ObjectsTable, TableAction, TableColumn, TableSelection, TableState } from "@eyeseetea/d2-ui-components";
import { Icon } from "@material-ui/core";
import React, { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import i18n from "../../../utils/i18n";
import { Notification } from "../../../domain/entities/Notification";
import { NotificationContent } from "./NotificationContent";

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

export const NotificationListTable: React.FC<NotificationListTableProps> = props => {
    const { notifications, editNotification } = props;
    const [selection, setSelection] = useState<TableSelection[]>([]);

    const actions: TableAction<Notification>[] = useMemo(
        () => [
            {
                name: "edit",
                text: i18n.t("Edit"),
                icon: <Icon>edit</Icon>,
                onClick: ids => {
                    const id = ids[0];
                    if (id) editNotification(id);
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
        [editNotification]
    );

    const onChange = useCallback((state: TableState<Notification>) => {
        setSelection(state.selection);
    }, []);

    return (
        <PageWrapper>
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

type NotificationListTableProps = {
    notifications: Notification[];
    editNotification: (notifId: string) => void;
};

const PageWrapper = styled.div`
    .MuiTableRow-root {
        background: white;
    }
`;
