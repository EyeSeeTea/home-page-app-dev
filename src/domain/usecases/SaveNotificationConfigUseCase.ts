import { NotificationRepository } from "../repositories/NotificationRepository";
import { FutureData } from "../types/Future";
import { NotificationConfig } from "../entities/Notification";

export class SaveNotificationConfigUseCase {
    constructor(private notificationRepository: NotificationRepository) {}

    public execute(config: ShallowPartial<NotificationConfig>): FutureData<void> {
        return this.notificationRepository
            .getConfig()
            .map<NotificationConfig>(currentConfig => ({
                ...currentConfig,
                permissions: {
                    ...currentConfig.permissions,
                    ...config.permissions,
                },
            }))
            .flatMap(updatedConfig => this.notificationRepository.saveConfig(updatedConfig));
    }
}

type ShallowPartial<T> = {
    [K in keyof T]?: T[K] extends object ? { [P in keyof T[K]]?: T[K][P] } : T[K];
};
