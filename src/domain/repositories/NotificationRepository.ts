import { Notification } from "../entities/Notification";

export interface NotificationFilters {
    wildcard?: string;
}

export interface NotificationRepository {
    list(options?: { filters?: NotificationFilters }): Promise<Notification[]>;
    save(notification: Notification): Promise<void>;
}
