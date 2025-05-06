import _ from "lodash";

import { NotificationRepository } from "../repositories/NotificationRepository";
import { FutureData } from "../types/Future";
import { Notification } from "../entities/Notification";
import { UserRepository } from "../repositories/UserRepository";

export class GetNotificationsUseCase {
    constructor(private notificationRepository: NotificationRepository, private userRepository: UserRepository) {}

    public execute(): FutureData<Notification[]> {
        return this.notificationRepository
            .list()
            .flatMap(notifications => this.getAccessibleNotifications(notifications))
            .map(notifications =>
                _(notifications)
                    .orderBy(notification => notification.createdAt, "desc")
                    .value()
            );
    }

    private getAccessibleNotifications(notifications: Notification[]): FutureData<Notification[]> {
        return this.userRepository
            .getCurrentUser()
            .map(user =>
                notifications.filter(notification => notification.canView(user) || notification.canWrite(user))
            );
    }
}
