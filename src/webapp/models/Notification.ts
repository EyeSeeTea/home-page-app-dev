import { Notification, NotificationAttrs } from "../../domain/entities/Notification";
import { User } from "../../domain/entities/User";

export type NotificationViewModel = Omit<NotificationAttrs, "userId"> & {
    canView: boolean;
    canEdit: boolean;
};

export function getNotificationViewModel(notifications: Notification[], user: User): NotificationViewModel[] {
    return notifications.map(notification => ({
        id: notification.id,
        content: notification.content,
        recipients: notification.recipients,
        readBy: notification.readBy,
        createdAt: notification.createdAt,
        permissions: notification.permissions,
        canView: notification.canView(user),
        canEdit: notification.canEdit(user),
    }));
}
