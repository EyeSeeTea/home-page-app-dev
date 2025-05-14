import { UseCase } from "./UseCase";
import { User } from "../entities/User";
import { Notification, NotificationWildcard } from "../entities/Notification";
import { NotificationRepository } from "../repositories/NotificationRepository";
import { FutureData } from "../types/Future";

export class GetUserNotificationsUseCase implements UseCase {
    constructor(private notificationRepository: NotificationRepository) {}

    execute(user: User): FutureData<Notification[]> {
        return this.notificationRepository
            .list({
                wildcard: [NotificationWildcard.ALL, NotificationWildcard.ANDROID, NotificationWildcard.BOTH],
            })
            .map(notifications => {
                return notifications.filter(notification => {
                    const isUnread = !notification.isReadBy(user.id);
                    if (!isUnread) return false;

                    if (notification.recipients.wildcard === NotificationWildcard.ALL) {
                        return true;
                    }

                    const isUserRecipient = notification.recipients.users.some(u => u.id === user.id);

                    const hasGroupAccess = notification.recipients.userGroups.some(group =>
                        user.userGroups.some(userGroup => userGroup.id === group.id)
                    );

                    return isUserRecipient || hasGroupAccess;
                });
            });
    }
}
