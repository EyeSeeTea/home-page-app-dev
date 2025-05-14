import { UseCase } from "./UseCase";
import { User } from "../entities/User";
import { Notification } from "../entities/Notification";
import { NotificationRepository, NotificationFilters } from "../repositories/NotificationRepository";

export interface GetUserNotificationsOptions {
    filters?: NotificationFilters;
}

export class GetUserNotifications implements UseCase {
    constructor(private notificationRepository: NotificationRepository) {}

    async execute(options?: GetUserNotificationsOptions): Promise<Notification[]> {
        return this.notificationRepository.list({ filters: options?.filters });
    }
}
