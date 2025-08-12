import { NotificationRepository } from "../repositories/NotificationRepository";
import { Future, FutureData } from "../types/Future";
import { Notification } from "../entities/Notification";
import { User } from "../entities/User";

export class SaveNotificationsUseCase {
    constructor(private notificationRepository: NotificationRepository) {}

    public execute(notifications: Notification[], user: User): FutureData<void> {
        const allErrors = notifications.flatMap(notification => {
            const errors = notification.validate({ user });
            return errors.map(err => err.message);
        });

        if (allErrors.length > 0) {
            return Future.error(allErrors.join("\n"));
        }

        // assume user saving the notification has read it
        const updatedNotifs = notifications.map(notification => notification.markAsRead(user));
        return this.notificationRepository.save(updatedNotifs);
    }
}
