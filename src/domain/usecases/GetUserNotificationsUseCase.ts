import { UseCase } from "./UseCase";
import { User } from "../entities/User";
import { Notification, NotificationWildcard } from "../entities/Notification";
import { NotificationRepository } from "../repositories/NotificationRepository";

export class GetUserNotificationsUseCase implements UseCase {
    constructor(private notificationRepository: NotificationRepository) {}

    async execute(user: User): Promise<Notification[]> {
        const allNotifications = await Promise.all([
            this.notificationRepository.list({ wildcard: NotificationWildcard.ALL }),
            this.notificationRepository.list({ wildcard: NotificationWildcard.ANDROID }),
            this.notificationRepository.list({ wildcard: NotificationWildcard.BOTH }),
        ]);

        const notifications = allNotifications.flat();

        return notifications.filter(notification => {
            const isUnread = !notification.isReadBy(user.id);
            if (!isUnread) return false;

            // If wildcard is ALL, ignore recipients check
            if (notification.recipients.wildcard === NotificationWildcard.ALL) {
                return true;
            }

            // Check if user is directly in recipients
            const isUserRecipient = notification.recipients.users.some(u => u.id === user.id);

            // Check if any of user's groups are in recipients
            const hasGroupAccess = notification.recipients.userGroups.some(group =>
                user.userGroups.some(userGroup => userGroup.id === group.id)
            );

            return isUserRecipient || hasGroupAccess;
        });
    }
}
