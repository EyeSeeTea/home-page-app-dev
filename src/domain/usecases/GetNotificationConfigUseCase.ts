import { NotificationConfig } from "../entities/NotificationConfig";
import { NotificationConfigRepository } from "../repositories/NotificationConfigRepository";
import { FutureData } from "../types/Future";
import { UseCase } from "./UseCase";

export class GetNotificationConfigUseCase implements UseCase {
    constructor(private notificationConfigRepository: NotificationConfigRepository) {}

    public execute(): FutureData<NotificationConfig> {
        return this.notificationConfigRepository.get();
    }
}
