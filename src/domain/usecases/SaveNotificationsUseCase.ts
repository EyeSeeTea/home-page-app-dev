import { NotificationRepository } from "../repositories/NotificationRepository";
import { FutureData } from "../types/Future";
import { Notification } from "../entities/Notification";
import { User } from "../entities/User";

export class SaveNotificationsUseCase {
    constructor(private notificationRepository: NotificationRepository) {}

    public execute(notifications: Notification[], user: User): FutureData<void> {
        const updatedNotifs = this.updateNotifications(user, notifications);
        return this.notificationRepository.save(updatedNotifs);
    }

    private updateNotifications(user: User, notifications: Notification[]): Notification[] {
        //assume user saving the notification has read it
        return notifications.map(notification => {
            return Notification.create({
                ...notification.markAsRead(user),
            });
        });
    }
}
