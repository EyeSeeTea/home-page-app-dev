import { Notification, NotificationWildcard } from "../entities/Notification";

export interface ListNotificationFilters {
    wildcard?: NotificationWildcard;
}

export interface NotificationRepository {
    list(options?: ListNotificationFilters): Promise<Notification[]>;
    save(notification: Notification): Promise<void>;
}
