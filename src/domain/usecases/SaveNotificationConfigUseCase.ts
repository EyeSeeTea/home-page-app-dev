import { NotificationConfigRepository } from "../repositories/NotificationConfigRepository";
import { FutureData } from "../types/Future";
import { NotificationConfig } from "../entities/Notification";

export class SaveNotificationConfigUseCase {
    constructor(private notificationConfigRepository: NotificationConfigRepository) {}

    public execute(config: ShallowPartial<NotificationConfig>): FutureData<void> {
        return this.notificationConfigRepository
            .get()
            .map<NotificationConfig>(currentConfig => ({
                permissions: {
                    ...currentConfig.permissions,
                    ...config.permissions,
                },
            }))
            .flatMap(updatedConfig => this.notificationConfigRepository.save(updatedConfig));
    }
}

type ShallowPartial<T> = {
    [K in keyof T]?: T[K] extends object ? { [P in keyof T[K]]?: T[K][P] } : T[K];
};
