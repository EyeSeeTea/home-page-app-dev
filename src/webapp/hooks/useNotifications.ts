import { useState, useEffect } from "react";
import { CompositionRoot } from "../CompositionRoot";
import { Notification } from "../../domain/entities/Notification";
import { User } from "../../domain/entities/User";

export const useNotifications = (compositionRoot?: CompositionRoot, currentUser?: User) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (!compositionRoot || !currentUser) return;

        const fetchNotifications = async () => {
            const result = await compositionRoot.notifications.listUserNotifications(currentUser).toPromise();
            setNotifications(result);
        };

        fetchNotifications();
    }, [compositionRoot, currentUser]);

    const markAsRead = async (notification: Notification) => {
        if (!compositionRoot || !currentUser) return;
        await compositionRoot.notifications.markUserAsRead({ notification, user: currentUser }).toPromise();
        setNotifications(notifications.filter(n => n.id !== notification.id));
    };

    return { notifications, markAsRead };
};
