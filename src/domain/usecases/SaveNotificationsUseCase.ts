import { NotificationRepository } from "../repositories/NotificationRepository";
import { FutureData } from "../types/Future";
import { Notification } from "../entities/Notification";
import _ from "lodash";

export class SaveNotificationsUseCase {
    constructor(private notificationRepository: NotificationRepository) {}

    public execute(notifications: Notification[]): FutureData<void> {
        return this.notificationRepository
            .list(null)
            .map(allNotifications => this.updateNotifications(allNotifications, notifications))
            .flatMap(updatedAndNew => this.notificationRepository.save(updatedAndNew));
    }

    private updateNotifications(allNotifications: Notification[], notifications: Notification[]): Notification[] {
        const notificationMap = _.keyBy(notifications, notification => notification.id);
        const updatedNotifs = allNotifications
            .filter(notification => !!notificationMap[notification.id])
            .map(notificationToUpdate => ({ ...notificationToUpdate, ...notificationMap[notificationToUpdate.id] }));
        const newNotifs = _.differenceBy(notifications, updatedNotifs, notification => notification.id);

        return [...updatedNotifs, ...newNotifs];
    }
}
