import { Notification } from "../entities/Notification";
import { User } from "../entities/User";

export interface NotificationFilters {
    wildcard?: string;
}

export interface NotificationRepository {
    list(options?: { filters?: NotificationFilters }): Promise<Notification[]>;
    get(id: string): Promise<Notification | undefined>;
    save(notification: Notification): Promise<void>;
}
