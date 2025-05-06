import _ from "lodash";

import { NotificationRepository } from "../repositories/NotificationRepository";
import { FutureData } from "../types/Future";
import { Notification } from "../entities/Notification";
import { isSuperAdmin, User } from "../entities/User";

export class GetNotificationsUseCase {
    constructor(private notificationRepository: NotificationRepository) {}

    public execute(user: User): FutureData<Notification[]> {
        return this.notificationRepository
            .list()
            .map(notifications => this.getAccessibleNotifications(notifications, user))
            .map(notifications =>
                _(notifications)
                    .orderBy(notification => notification.createdAt, "desc")
                    .value()
            );
    }

    private getAccessibleNotifications(notifications: Notification[], user: User): Notification[] {
        return isSuperAdmin(user)
            ? notifications
            : notifications.filter(notification => notification.canView(user) || notification.canEdit(user));
    }
}
