import { Notification, NotificationAttrs } from "../../domain/entities/Notification";

export type NotificationViewModel = NotificationAttrs;

export function getNotificationViewModel(notifications: Notification[]): NotificationViewModel[] {
    return notifications.map(notification => ({
        id: notification.id,
        content: notification.content,
        recipients: notification.recipients,
        readBy: notification.readBy,
        createdAt: notification.createdAt,
        permissions: notification.permissions,
    }));
}

export function toNotification(notifications: NotificationViewModel[]) {
    return notifications.map(notification => Notification.create(notification));
}
