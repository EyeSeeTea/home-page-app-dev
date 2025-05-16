import { NotificationConfig } from "../entities/NotificationConfig";
import { NotificationConfigRepository } from "../repositories/NotificationConfigRepository";
import { Future, FutureData } from "../types/Future";
import { UseCase } from "./UseCase";

type PartialNotificationConfig = {
    permissions?: {
        users?: NotificationConfig["permissions"]["users"];
        userGroups?: NotificationConfig["permissions"]["userGroups"];
    };
};

export class SaveNotificationConfigUseCase implements UseCase {
    constructor(private notificationConfigRepository: NotificationConfigRepository) {}

    public execute(partialConfig: PartialNotificationConfig): FutureData<void> {
        return this.notificationConfigRepository
            .get()
            .map(currentConfig => ({
                ...currentConfig,
                permissions: {
                    ...currentConfig.permissions,
                    ...partialConfig.permissions,
                },
            }))
            .flatMap(updatedConfig => this.notificationConfigRepository.save(updatedConfig));
    }
}
