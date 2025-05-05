import { FutureData } from "../types/Future";
import { Notification, NotificationConfig, NotificationWildcardType } from "../entities/Notification";

export interface NotificationRepository {
    list(options?: NotificationListOptions): FutureData<Notification[]>;
    save(notifications: Notification[]): FutureData<void>;
    delete(notifications: Notification[]): FutureData<void>;

    getConfig(): FutureData<NotificationConfig>;
    saveConfig(config: NotificationConfig): FutureData<void>;
}

export type NotificationListOptions = {
    wildcard?: NotificationWildcardType[];
};
