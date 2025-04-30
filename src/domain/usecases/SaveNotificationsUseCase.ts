import _ from "lodash";

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
            .flatMap(user => this.fetchAndUpdateNotifications(user, notifications));
    }

    private fetchAndUpdateNotifications(user: User, notifications: Notification[]): FutureData<void> {
        return this.notificationRepository
            .list(null)
            .map(allNotifications => this.updateNotifications(allNotifications, notifications, user))
            .flatMap(updatedAndNew => this.notificationRepository.save(updatedAndNew));
    }

    private updateNotifications(
        allNotifications: Notification[],
        notifications: Notification[],
        user: User
    ): Notification[] {
        //assume current user saving/updating the notification has read the notification
        const readNotifications = notifications.map(notification => notification.markAsRead(user));

        const notificationMap = _.keyBy(readNotifications, notification => notification.id);
        const updatedNotifs = allNotifications
            .filter(notification => !!notificationMap[notification.id])
            .map(notificationToUpdate =>
                Notification.create({ ...notificationToUpdate, ...notificationMap[notificationToUpdate.id] })
            );
        const newNotifs = _.differenceBy(readNotifications, updatedNotifs, notification => notification.id);

        return [...updatedNotifs, ...newNotifs];
    }
}
