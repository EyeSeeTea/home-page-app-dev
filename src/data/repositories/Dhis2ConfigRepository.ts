import _ from "lodash";
import { LandingPagePermission, Permission } from "../../domain/entities/Permission";
import { ConfigRepository } from "../../domain/repositories/ConfigRepository";
import { D2Api } from "../../types/d2-api";
import { cache } from "../../utils/cache";
import { DataStoreStorageClient } from "../clients/storage/DataStoreStorageClient";
import { Namespaces } from "../clients/storage/Namespaces";
import { StorageClient } from "../clients/storage/StorageClient";
import { Instance } from "../entities/Instance";
import { PersistedSettings } from "../entities/PersistedSettings";
import { getD2APiFromInstance, getMajorVersion } from "../../utils/d2-api";
import { User } from "../../domain/entities/User";
import { PersistedLandingNode } from "../entities/PersistedLandingNode";
import { Config } from "../entities/Config";
import { Maybe } from "../../types/utils";

export class Dhis2ConfigRepository implements ConfigRepository {
    private instance: Instance;
    private api: D2Api;
    private storageClient: StorageClient;

    constructor(baseUrl: string) {
        this.instance = new Instance({ url: baseUrl });
        this.api = getD2APiFromInstance(this.instance);
        this.storageClient = new DataStoreStorageClient({ type: "global", instance: this.instance });
    }

    async get(): Promise<Config> {
        return {
            currentUser: await this.getUser(),
            instance: this.instance,
            api: this.api,
            storageClient: this.storageClient,
        };
    }

    @cache()
    public async getUser(): Promise<User> {
        const d2User = await this.api.currentUser
            .get({
                fields: {
                    id: true,
                    displayName: true,
                    userGroups: { id: true, name: true },
                    userCredentials: {
                        username: true,
                        userRoles: { id: true, name: true, authorities: true },
                    },
                    settings: { keyUiLocale: true },
                },
            })
            .getData();

        return {
            id: d2User.id,
            name: d2User.displayName,
            userGroups: d2User.userGroups,
            ...d2User.userCredentials,
        };
    }

    public async getUiLocale(d2User: { settings: { keyUiLocale: string; keyDbLocale: string } }): Promise<string> {
        const version = getMajorVersion(await this.api.getVersion());
        if (version > 30 && d2User.settings.keyUiLocale) {
            return d2User.settings.keyUiLocale;
        }

        const settings = await this.api.get<{ keyUiLocale: string }>("/userSettings").getData();
        return settings.keyUiLocale ?? "en";
    }

    public getInstance(): Instance {
        return this.instance;
    }

    public async getDefaultApplication(): Promise<string> {
        const { defaultApplication = "" } = await this.getSettings();
        return defaultApplication;
    }

    private async setSettings(settings: PersistedSettings): Promise<void> {
        await this.storageClient.saveObject<PersistedSettings>(Namespaces.CONFIG, settings);
    }

    public async updateDefaultApplication(defaultApplication: string): Promise<void> {
        const config = await this.getSettings();

        await this.setSettings({
            ...config,
            defaultApplication,
        });
    }

    public async getGoogleAnalyticsCode(): Promise<Maybe<string>> /*Use of Maybe intended*/ {
        const { googleAnalyticsCode } = await this.getSettings();
        return googleAnalyticsCode;
    }

    public async updateGoogleAnalyticsCode(code: string): Promise<void> {
        const config = await this.getSettings();

        await this.setSettings({
            ...config,
            googleAnalyticsCode: code,
        });
    }

    public async getSettingsPermissions(): Promise<Permission> {
        const config = await this.getSettings();
        const { users = [], userGroups = [] } = config.settingsPermissions ?? {};
        return { users, userGroups };
    }

    public async updateSettingsPermissions(update: Partial<Permission>): Promise<void> {
        const config = await this.getSettings();
        const { users = [], userGroups = [] } = config.settingsPermissions ?? {};

        await this.setSettings({
            ...config,
            settingsPermissions: {
                users: update.users ?? users,
                userGroups: update.userGroups ?? userGroups,
            },
        });
    }

    public async getLandingPagePermissions(): Promise<LandingPagePermission[]> {
        const config = await this.getSettings();
        const landingPagesPermissions = config.landingPagePermissions ?? [];

        const persisted =
            (await this.storageClient.getObject<PersistedLandingNode[][]>(Namespaces.LANDING_PAGES)) ?? [];

        // Ensure that only permissions for existing landing pages are returned
        // As the delete of landing pages did not remove their permissions from config
        const existingPermissions = landingPagesPermissions.filter(perm =>
            persisted.some(page => page.some(item => item.id === perm.id))
        );

        return _.isEmpty(existingPermissions)
            ? [{ id: "", publicAccess: "r-------", userGroups: [], users: [] }]
            : existingPermissions;
    }

    public async deleteLandingPagesPermissions(ids: string[]): Promise<void> {
        const config = await this.getSettings();
        const landingPagesPermissions = config.landingPagePermissions ?? [];

        const updatedPermissions = landingPagesPermissions.filter(perm => !ids.includes(perm.id));

        await this.setSettings({
            ...config,
            landingPagePermissions: updatedPermissions,
        });
    }

    public async saveLandingPagesPermissions(permissions: LandingPagePermission[]): Promise<void> {
        const config = await this.getSettings();
        const landingPagesPermissions = config.landingPagePermissions ?? [];

        const mergedPermissions = permissions.reduce((acc, perm) => {
            const existingIndex = acc.findIndex(p => p.id === perm.id);
            if (existingIndex !== -1) {
                acc[existingIndex] = perm;
            } else {
                acc.push(perm);
            }
            return acc;
        }, landingPagesPermissions);

        await this.setSettings({
            ...config,
            landingPagePermissions: mergedPermissions,
        });
    }

    public async updateLandingPagePermissions(update: Partial<LandingPagePermission>, id: string): Promise<void> {
        const config = await this.getSettings();
        const landingPagesPermissions = config.landingPagePermissions ?? [];

        const {
            users = [],
            userGroups = [],
            publicAccess = "r-------",
        } = landingPagesPermissions.find(landingPage => landingPage.id === id) ?? {};

        landingPagesPermissions.some(landing => landing.id === id)
            ? Object.assign(landingPagesPermissions.find(landing => landing.id === id) ?? {}, {
                  id,
                  userGroups: update.userGroups ?? userGroups,
                  users: update.users ?? users,
                  publicAccess: update.publicAccess ?? publicAccess,
              })
            : landingPagesPermissions.push({
                  id,
                  userGroups: update.userGroups ?? userGroups,
                  users: update.users ?? users,
                  publicAccess: update.publicAccess ?? publicAccess,
              });

        await this.setSettings({
            ...config,
            landingPagePermissions: landingPagesPermissions,
        });
    }

    public async getShowAllActions(): Promise<boolean> {
        const { showAllActions = true } = await this.getSettings();
        return showAllActions;
    }

    public async setShowAllActions(showAllActions: boolean): Promise<void> {
        const config = await this.getSettings();

        await this.setSettings({
            ...config,
            showAllActions,
        });
    }

    private async getSettings(): Promise<PersistedSettings> {
        const config = await this.storageClient.getObject<PersistedSettings>(Namespaces.CONFIG);
        return config ?? {};
    }
}
