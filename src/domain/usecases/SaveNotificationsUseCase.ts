import { NotificationRepository } from "../repositories/NotificationRepository";
import { FutureData } from "../types/Future";
import { Notification } from "../entities/Notification";
import { UserRepository } from "../repositories/UserRepository";
import { User } from "../entities/User";

export class SaveNotificationsUseCase {
    constructor(private notificationRepository: NotificationRepository, private userRepository: UserRepository) {}

    public execute(notifications: Notification[]): FutureData<void> {
        return this.userRepository
            .getCurrentUser()
            .flatMap(user => this.updateAndSaveNotifications(user, notifications));
    }

    private updateAndSaveNotifications(user: User, notifications: Notification[]): FutureData<void> {
        //assume user saving the notification has read it
        const readNotifications = notifications.map(notification => {
            return Notification.create({
                ...notification.markAsRead(user),
                userId: notification.userId || user.id,
                userName: notification.userName || user.name,
            });
        });
        return this.notificationRepository.save(readNotifications);
    }
}
