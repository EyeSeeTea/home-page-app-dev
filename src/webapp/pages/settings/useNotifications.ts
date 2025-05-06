import { useCallback, useEffect, useMemo, useState } from "react";
import { useSnackbar } from "@eyeseetea/d2-ui-components";

import { useAppContext } from "../../contexts/app-context";
import { Notification } from "../../../domain/entities/Notification";
import { NotificationDetailsDialogProps } from "../../components/user-notification/NotificationDetailsDialog";
import i18n from "../../../utils/i18n";
import { getNotificationViewModel, NotificationViewModel, toNotification } from "../../models/Notification";

export const useNotifications = () => {
    const { compositionRoot } = useAppContext();
    const snackbar = useSnackbar();
    const [notifDetailsDialog, setNotifDetailsDialog] = useState<NotificationDetailsDialogProps>();
    const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const notifications = useMemo(() => getNotificationViewModel(allNotifications), [allNotifications]);

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const notifications = await compositionRoot.notifications.get().toPromise();
            setAllNotifications(notifications);
        } catch (err: any) {
            snackbar.error((err && err.message) || err.toString());
        } finally {
            setIsLoading(false);
        }
    }, [compositionRoot, snackbar]);

    const saveNotifications = useCallback(
        async (notifications: NotificationViewModel[]) => {
            setIsLoading(true);
            try {
                await compositionRoot.notifications.save(toNotification(notifications)).toPromise();
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
            const notification = allNotifications.find(({ id }) => notifId === id);
            if (!notification) return;

            setNotifDetailsDialog({
                initialNotification: { ...notification },
                onClose: () => setNotifDetailsDialog(undefined),
                onSave: notification => saveNotifications([notification]),
            });
        },
        [allNotifications, saveNotifications]
    );

    const onNewNotification = useCallback(() => {
        setNotifDetailsDialog({
            onClose: () => setNotifDetailsDialog(undefined),
            onSave: notification => saveNotifications([notification]),
        });
    }, [saveNotifications]);

    const deleteNotifications = useCallback(
        async (notifIds: string[]) => {
            setIsLoading(true);
            const notificationsToDelete = allNotifications.filter(({ id }) => notifIds.includes(id));
            try {
                await compositionRoot.notifications.delete(toNotification(notificationsToDelete)).toPromise();
                snackbar.success(i18n.t("Successfully deleted notifications"));
            } catch (err: any) {
                snackbar.error((err && err.message) || err.toString());
            } finally {
                await fetchNotifications();
            }
        },
        [allNotifications, compositionRoot.notifications, snackbar, fetchNotifications]
    );

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    //sync notification loading state with dialog props
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
        onNewNotification,
        deleteNotifications,
    };
};
