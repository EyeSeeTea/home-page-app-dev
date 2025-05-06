import { NotificationRepository } from "../repositories/NotificationRepository";
import { FutureData } from "../types/Future";
import { User } from "../entities/User";
import { Notification } from "../entities/Notification";

export class ReadUserNotificationsUseCase {
    constructor(private notificationRepository: NotificationRepository) {}

    public execute(notifications: Notification[], user: User): FutureData<void> {
        const readNotifications = notifications.map(notification => notification.markAsRead(user));
        return this.notificationRepository.save(readNotifications);
    }
}
