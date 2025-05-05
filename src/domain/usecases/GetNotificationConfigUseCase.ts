import { NotificationRepository } from "../repositories/NotificationRepository";
import { FutureData } from "../types/Future";
import { NotificationConfig } from "../entities/Notification";

export class GetNotificationConfigUseCase {
    constructor(private notificationRepository: NotificationRepository) {}

    public execute(): FutureData<NotificationConfig> {
        return this.notificationRepository.getConfig();
    }
}
