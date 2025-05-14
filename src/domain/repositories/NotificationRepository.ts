import { Notification } from "../entities/Notification";
import { User } from "../entities/User";

export interface NotificationRepository {
    getByUser(user: User): Promise<Notification[]>;
    save(notification: Notification): Promise<void>;
}
