import _ from "lodash";

import { NotificationRepository } from "../repositories/NotificationRepository";
import { FutureData } from "../types/Future";
import { Notification } from "../entities/Notification";
import { User } from "../entities/User";
import { Id } from "../entities/Ref";

export class ListNotificationsUseCase {
    constructor(private notificationRepository: NotificationRepository) {}

    public execute(user: User, ids?: Id[]): FutureData<Notification[]> {
        return this.notificationRepository
            .list({ ids })
            .map(notifications => this.getAccessibleNotifications(notifications, user))
            .map(notifications =>
                _(notifications)
                    .orderBy(notification => notification.createdAt, "desc")
                    .value()
            );
    }

    private getAccessibleNotifications(notifications: Notification[], user: User): Notification[] {
        return notifications.filter(notification => notification.canView(user) || notification.canEdit(user));
    }
}
