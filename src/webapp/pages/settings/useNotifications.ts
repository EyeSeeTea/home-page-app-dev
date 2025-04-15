import { useAppContext } from "../../contexts/app-context";
import { useCallback, useEffect, useState } from "react";
import { Notification } from "../../../domain/entities/Notification";
import { NotificationDetailsDialogProps } from "../../components/user-notification/NotificationDetailsDialog";

export const useNotifications = () => {
    const { compositionRoot } = useAppContext();

    const [notifDetailsDialog, setNotifDetailsDialog] = useState<NotificationDetailsDialogProps>();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const fetchNotifications = useCallback(
        () =>
            compositionRoot.notifications
                .get()
                .toPromise()
                .then(notifications => setNotifications(notifications)),
        [compositionRoot]
    );

    const saveNotifications = useCallback(
        (notifications: Notification[]) => {
            return compositionRoot.notifications
                .save(notifications)
                .toPromise()
                .finally(() => fetchNotifications());
        },
        [compositionRoot, fetchNotifications]
    );

    const editNotification = useCallback(
        (notifId: string) => {
            const notification = notifications.find(({ id }) => notifId === id);
            if (!notification) return;

            setNotifDetailsDialog({
                initialNotification: { ...notification },
                onClose: () => setNotifDetailsDialog(undefined),
                onSave: notification => saveNotifications([notification]),
            });
        },
        [notifications, saveNotifications]
    );

    const newNotification = useCallback(() => {
        setNotifDetailsDialog({
            onClose: () => setNotifDetailsDialog(undefined),
            onSave: notification => saveNotifications([notification]),
        });
    }, [saveNotifications]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return {
        notifications,
        notifDetailsDialog,
        editNotification,
        newNotification,
    };
};
