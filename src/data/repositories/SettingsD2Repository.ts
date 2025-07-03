import { Settings } from "../../domain/entities/Settings";
import { SettingsRepository } from "../../domain/repositories/SettingsRepository";
import { Future, FutureData } from "../../domain/types/Future";
import { Instance } from "../entities/Instance";
import { DataStoreStorageClient } from "../clients/storage/DataStoreStorageClient";
import { LandingPagePermission, Permission } from "../../domain/entities/Permission";
import { Maybe } from "../../types/utils";
import { Namespaces } from "../clients/storage/Namespaces";
import i18n from "../../utils/i18n";

export class SettingsD2Repository implements SettingsRepository {
    private storageClient: DataStoreStorageClient;
    constructor(instance: Instance) {
        this.storageClient = new DataStoreStorageClient({ type: "global", instance: instance });
    }

    get(): FutureData<Settings> {
        return Future.fromPromise(this.getSettings())
            .map(settings => {
                const initialSettings = Settings.initialData();
                if (!settings) return initialSettings;

                return new Settings({
                    analytics: {
                        googleAnalyticsCode:
                            settings.googleAnalyticsCode ?? initialSettings.analytics.googleAnalyticsCode,
                        matomoUrl: settings.matomoUrl ?? initialSettings.analytics.matomoUrl,
                    },
                    defaultApplication: settings.defaultApplication ?? initialSettings.defaultApplication,
                    landingPagePermissions: settings.landingPagePermissions ?? initialSettings.landingPagePermissions,
                    permissions: settings.settingsPermissions ?? initialSettings.permissions,
                    showAllActions: settings.showAllActions ?? initialSettings.showAllActions,
                });
            })
            .flatMapError(error => {
                return Future.error(
                    `${i18n.t("An error has occurred fetching application settings")}\n${String(error)}`
                );
            });
    }

    save(settings: Settings): FutureData<void> {
        return Future.fromPromise(this.saveSettings(settings))
            .flatMap(() => Future.success(undefined))
            .flatMapError(error => {
                return Future.error(`${i18n.t("An error has occurred saving application settings")}\n${String(error)}`);
            });
    }

    private async saveSettings(settings: Settings): Promise<void> {
        const currentD2Settings = await this.getSettings();
        return this.storageClient.saveObject<D2DataStoreSettings>(Namespaces.CONFIG, {
            ...(currentD2Settings ?? {}),
            defaultApplication: settings.defaultApplication,
            googleAnalyticsCode: settings.analytics.googleAnalyticsCode,
            matomoUrl: settings.analytics.matomoUrl,
            settingsPermissions: settings.permissions,
            landingPagePermissions: settings.landingPagePermissions,
            showAllActions: settings.showAllActions,
        });
    }

    private async getSettings(): Promise<Maybe<D2DataStoreSettings>> {
        const config = await this.storageClient.getObject<D2DataStoreSettings>(Namespaces.CONFIG);
        // TODO: validate with purify-ts
        return config;
    }
}

type D2DataStoreSettings = {
    defaultApplication: Maybe<string>;
    settingsPermissions: Maybe<Permission>;
    landingPagePermissions: Maybe<LandingPagePermission[]>;
    showAllActions: Maybe<boolean>;
    googleAnalyticsCode: Maybe<string>;
    matomoUrl: Maybe<string>;
};
