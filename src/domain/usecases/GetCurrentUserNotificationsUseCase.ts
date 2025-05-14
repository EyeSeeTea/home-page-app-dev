import { UseCase } from "./UseCase";
import { User } from "../entities/User";
import { Notification } from "../entities/Notification";
import { NotificationRepository } from "../repositories/NotificationRepository";

export class GetCurrentUserNotificationsUseCase implements UseCase {
    constructor(private notificationRepository: NotificationRepository) {}

    async execute(user: User): Promise<Notification[]> {
        return this.notificationRepository.list();
    }
}
