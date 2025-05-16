import { UseCase } from "./UseCase";
import { User } from "../entities/User";
import { Notification, notificationWildcard } from "../entities/Notification";
import { NotificationRepository } from "../repositories/NotificationRepository";
import { FutureData } from "../types/Future";

export class ListUserNotificationsUseCase implements UseCase {
    constructor(private notificationRepository: NotificationRepository) {}

    execute(user: User): FutureData<Notification[]> {
        // Get notifications with relevant wildcards
        return this.notificationRepository
            .list({
                wildcard: [
                    notificationWildcard.ALL,
                    notificationWildcard.ANDROID,
                    notificationWildcard.BOTH,
                ],
            })
            .map(notifications => this.filterRelevantNotifications(notifications, user));
    }

    private filterRelevantNotifications(notifications: Notification[], user: User): Notification[] {
        return notifications.filter(notification => 
            this.isUnreadNotification(notification, user) && 
            this.isUserTargeted(notification, user)
        );
    }

    private isUnreadNotification(notification: Notification, user: User): boolean {
        return !notification.isReadBy(user.id);
    }

    private isUserTargeted(notification: Notification, user: User): boolean {
        // Check if notification is for all users
        if (notification.recipients.wildcard === notificationWildcard.ALL) {
            return true;
        }

        return (
            this.isDirectRecipient(notification, user) || 
            this.hasGroupAccess(notification, user)
        );
    }

    private isDirectRecipient(notification: Notification, user: User): boolean {
        return notification.recipients.users.some(recipient => recipient.id === user.id);
    }

    private hasGroupAccess(notification: Notification, user: User): boolean {
        return notification.recipients.userGroups.some(group =>
            user.userGroups.some(userGroup => userGroup.id === group.id)
        );
    }
}
