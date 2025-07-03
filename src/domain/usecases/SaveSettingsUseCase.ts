import i18n from "../../utils/i18n";
import { Settings } from "../entities/Settings";
import { hasSettingsAccess, User } from "../entities/User";
import { SettingsRepository } from "../repositories/SettingsRepository";
import { Future, FutureData } from "../types/Future";

export class SaveSettingsUseCase {
    constructor(private settingsRepository: SettingsRepository) {}

    execute(options: { user: User; settings: Settings }): FutureData<void> {
        const { user, settings } = options;
        if (hasSettingsAccess(settings, user)) {
            return this.settingsRepository.save(settings);
        } else {
            return Future.error(i18n.t("User does not have permission to save settings"));
        }
    }
}
