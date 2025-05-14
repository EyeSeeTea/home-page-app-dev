import { Notification, NotificationWildcard } from "../entities/Notification";
import { FutureData } from "../types/Future";

export interface ListNotificationFilters {
    wildcard?: NotificationWildcard[];
}

export interface NotificationRepository {
    list(options?: ListNotificationFilters): FutureData<Notification[]>;
    save(notification: Notification): FutureData<void>;
}
