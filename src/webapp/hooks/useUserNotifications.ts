import { useEffect, useState } from "react";

import { AppContextProviderProps } from "../contexts/app-context";
import { UserNotificationDialogProps } from "../components/user-notification/UserNotificationDialog";
import { Notification } from "../../domain/entities/Notification";
import { SetMethod } from "../models/helpers";

type useUserNotificationProps = {
    appContextProps: AppContextProviderProps | null;
};

export function useUserNotifications(props: useUserNotificationProps) {
    const { appContextProps } = props;
    const [isUserNotifsLoading, setIsUserNotifsLoading] = useState(true);
    const [userNotificationDialogProps, setUserNotificationDialogProps] = useState<UserNotificationDialogProps[]>();

    const continueLoading = () => {
        setUserNotificationDialogProps(undefined);
        setIsUserNotifsLoading(false);
    };

    const closeNotificationDialog = (notification: Notification) => {
        setUserNotificationDialogProps(prevDialogProps => {
            if (!prevDialogProps) return;
            return prevDialogProps.filter(dialog => dialog.notification.id !== notification.id);
        });
    };

    useEffect(() => {
        if (!appContextProps) return;
        initializeUserNotifications({
            appContextProps,
            closeNotificationDialog,
            setUserNotificationDialogProps,
            continueLoading,
        });
    }, [appContextProps]);

    useEffect(() => {
        if (userNotificationDialogProps && !userNotificationDialogProps.length) {
            continueLoading();
        }
    }, [userNotificationDialogProps]);

    return {
        isUserNotifsLoading: isUserNotifsLoading,
        userNotificationDialogProps: userNotificationDialogProps,
    };
}

type InitializeUserNotificationsProps = {
    appContextProps: AppContextProviderProps;
    closeNotificationDialog: (notification: Notification) => void;
    setUserNotificationDialogProps: SetMethod<UserNotificationDialogProps[]>;
    continueLoading: () => void;
};
async function initializeUserNotifications(props: InitializeUserNotificationsProps) {
    const { appContextProps, closeNotificationDialog, setUserNotificationDialogProps, continueLoading } = props;
    const { compositionRoot, currentUser } = appContextProps;

    try {
        const notifications = await compositionRoot.notification.listUserNotifications(currentUser).toPromise();

        if (notifications.length > 0) {
            setUserNotificationDialogProps(
                notifications.map(notification => ({
                    notification,
                    onClose: () => {
                        closeNotificationDialog(notification);
                    },
                    onConfirm: async () => {
                        await compositionRoot.notification.save([notification], currentUser).toPromise();
                        closeNotificationDialog(notification);
                    },
                }))
            );
        } else {
            continueLoading();
        }
    } catch {
        continueLoading();
    }
}
