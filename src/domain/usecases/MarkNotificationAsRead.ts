import { UseCase } from "./UseCase";
import { User } from "../entities/User";
import { Notification } from "../entities/Notification";
import { NotificationRepository } from "../repositories/NotificationRepository";

export class MarkNotificationAsRead implements UseCase {
    constructor(private notificationRepository: NotificationRepository) {}

    async execute(params: { notification: Notification; user: User }): Promise<void> {
        const { notification, user } = params;
        const updatedNotification = notification.markAsRead({
            id: user.id,
            name: user.name,
        });
        
        await this.notificationRepository.save(updatedNotification);
    }
}
