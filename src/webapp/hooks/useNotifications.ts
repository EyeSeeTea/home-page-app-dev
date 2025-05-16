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

    useEffect(() => {
        if (!compositionRoot || !currentUser) return;

        const fetchNotifications = async () => {
            const notifications = await compositionRoot.notifications.listUserNotifications(currentUser).toPromise();
            
            const newDialogProps = notifications.map(notification => ({
                key: notification.id,
                notifications: [notification],
                onClose: () => setDialogProps(current => 
                    current.filter(props => props.key !== notification.id)
                ),
                onConfirm: async () => {
                    await compositionRoot.notifications.markUserAsRead({ notification, user: currentUser }).toPromise();
                    setDialogProps(current => 
                        current.filter(props => props.key !== notification.id)
                    );
                }
            }));

            setDialogProps(newDialogProps);
        };

        fetchNotifications();
    }, [compositionRoot, currentUser]);

    return { dialogProps };
};
