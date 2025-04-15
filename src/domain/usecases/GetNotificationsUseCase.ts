import _ from "lodash";

import { NotificationRepository } from "../repositories/NotificationRepository";
import { FutureData } from "../types/Future";
import { Notification } from "../entities/Notification";

export class GetNotificationsUseCase {
    constructor(private notificationRepository: NotificationRepository) {}

    public execute(): FutureData<Notification[]> {
        return this.notificationRepository.list(null).map(notifications =>
            _(notifications)
                .orderBy(notification => notification.createdAt, "desc")
                .value()
        );
    }
}
