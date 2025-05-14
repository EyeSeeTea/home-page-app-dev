import { UseCase } from "./UseCase";
import { User } from "../entities/User";
import { Notification } from "../entities/Notification";
import { NotificationRepository } from "../repositories/NotificationRepository";
import { FutureData } from "../types/Future";

export class MarkNotificationAsReadUseCase implements UseCase {
    constructor(private notificationRepository: NotificationRepository) {}

    execute(params: { notification: Notification; user: User }): FutureData<void> {
        const { notification, user } = params;
        const updatedNotification = notification.markAsRead(user);

        return this.notificationRepository.save(updatedNotification);
    }
}
