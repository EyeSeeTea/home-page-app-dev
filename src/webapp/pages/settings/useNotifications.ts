import { useAppContext } from "../../contexts/app-context";
import { useCallback, useEffect, useState } from "react";
import { Notification } from "../../../domain/entities/Notification";
import { NotificationDetailsDialogProps } from "../../components/user-notification/NotificationDetailsDialog";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import i18n from "../../../utils/i18n";

export const useNotifications = () => {
    const { compositionRoot } = useAppContext();
    const snackbar = useSnackbar();

    const [notifDetailsDialog, setNotifDetailsDialog] = useState<NotificationDetailsDialogProps>();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const notifications = await compositionRoot.notifications.get().toPromise();
            setNotifications(notifications);
        } finally {
            setIsLoading(false);
        }
    }, [compositionRoot]);

    const saveNotifications = useCallback(
        async (notifications: Notification[]) => {
            setIsLoading(true);
            try {
                await compositionRoot.notifications.save(notifications).toPromise();
                setNotifDetailsDialog(undefined);
            } catch (err: any) {
                snackbar.error((err && err.message) || err.toString());
            } finally {
                await fetchNotifications();
            }
        },
        [compositionRoot.notifications, fetchNotifications, snackbar]
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

    const deleteNotifications = useCallback(
        async (notifIds: string[]) => {
            setIsLoading(true);
            const notificationsToDelete = notifications.filter(({ id }) => notifIds.includes(id));
            try {
                await compositionRoot.notifications.delete(notificationsToDelete).toPromise();
                snackbar.success(i18n.t("Successfully deleted notifications"));
            } catch (err: any) {
                snackbar.error((err && err.message) || err.toString());
            } finally {
                await fetchNotifications();
            }
        },
        [notifications, compositionRoot.notifications, snackbar, fetchNotifications]
    );

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        setNotifDetailsDialog(props =>
            props
                ? {
                      ...props,
                      isLoading: isLoading,
                  }
                : undefined
        );
    }, [isLoading]);

    return {
        isNotificationLoading: isLoading,
        notifications,
        notifDetailsDialog,
        editNotification,
        newNotification,
        deleteNotifications,
    };
};
