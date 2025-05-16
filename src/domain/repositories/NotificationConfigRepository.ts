import { NotificationConfig } from "../entities/NotificationConfig";
import { FutureData } from "../types/Future";

export interface NotificationConfigRepository {
    save(config: NotificationConfig): FutureData<void>;
    get(): FutureData<NotificationConfig>;
}
