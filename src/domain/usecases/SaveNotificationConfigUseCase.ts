import { NotificationRepository } from "../repositories/NotificationRepository";
import { FutureData } from "../types/Future";
import { NotificationConfig } from "../entities/Notification";

export class SaveNotificationConfigUseCase {
    constructor(private notificationRepository: NotificationRepository) {}

    public execute(config: NotificationConfig): FutureData<void> {
        return this.notificationRepository.saveConfig(config);
    }
}
