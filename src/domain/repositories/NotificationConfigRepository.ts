import { FutureData } from "../types/Future";
import { NotificationConfig } from "../entities/Notification";

export interface NotificationConfigRepository {
    get(): FutureData<NotificationConfig>;
    save(config: NotificationConfig): FutureData<void>;
}
