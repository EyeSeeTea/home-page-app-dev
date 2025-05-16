import { useState, useEffect } from "react";
import { CompositionRoot } from "../CompositionRoot";
import { Notification } from "../../domain/entities/Notification";
import { User } from "../../domain/entities/User";

interface NotificationDialogProps {
    key: string;
    notifications: Notification[];
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export const useNotifications = (compositionRoot?: CompositionRoot, currentUser?: User) => {
    const [dialogProps, setDialogProps] = useState<NotificationDialogProps[]>([]);
    const [allNotificationsHandled, setAllNotificationsHandled] = useState(false);

    useEffect(() => {
        if (!compositionRoot || !currentUser) return;

        const fetchNotifications = async () => {
            try {
                const notifications = await compositionRoot.notifications.listUserNotifications(currentUser).toPromise();

                const newDialogProps = notifications.map(notification => ({
                    key: notification.id,
                    notifications: [notification],
                    onClose: () => handleNotification(notification.id),
                    onConfirm: async () => {
                        try {
                            await compositionRoot.notifications.markUserAsRead({ notification, user: currentUser }).toPromise();
                            handleNotification(notification.id);
                        } catch (error) {
                            console.error("Error marking notification as read:", error);
                            // Still close the dialog even if marking as read fails
                            handleNotification(notification.id);
                        }
                    },
                }));

                setDialogProps(newDialogProps);
                setAllNotificationsHandled(newDialogProps.length === 0);
            } catch (error) {
                console.error("Error fetching notifications:", error);
                // Ensure app continues loading if notifications fail
                setAllNotificationsHandled(true);
            }
        };

        fetchNotifications();
    }, [compositionRoot, currentUser]);

    const handleNotification = (id: string) => {
        setDialogProps(current => {
            const updated = current.filter(props => props.key !== id);
            setAllNotificationsHandled(updated.length === 0);
            return updated;
        });
    };

    return { dialogProps, allNotificationsHandled };
};
