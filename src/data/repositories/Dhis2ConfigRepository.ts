import { ConfigRepository } from "../../domain/repositories/ConfigRepository";
import { D2Api } from "../../types/d2-api";
import { cache } from "../../utils/cache";
import { DataStoreStorageClient } from "../clients/storage/DataStoreStorageClient";
import { StorageClient } from "../clients/storage/StorageClient";
import { Instance } from "../entities/Instance";
import { getD2APiFromInstance, getMajorVersion } from "../../utils/d2-api";
import { User } from "../../domain/entities/User";
import { Config } from "../entities/Config";

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
    private async getUser(): Promise<User> {
        const d2User = await this.api.currentUser
            .get({
                fields: {
                    id: true,
                    displayName: true,
                    // v42+: authorities and username may be top-level on /me
                    authorities: true,
                    username: true,
                    userGroups: { id: true, name: true },
                    userCredentials: {
                        username: true,
                        userRoles: { id: true, name: true, authorities: true },
                    },
                    settings: { keyUiLocale: true },
                },
            })
            .getData();

        const username = d2User.username ?? d2User.userCredentials?.username ?? "";
        const userRoles =
            d2User.userCredentials?.userRoles ??
            (d2User.authorities ? [{ id: "authorities", name: "authorities", authorities: d2User.authorities }] : []);

        return {
            id: d2User.id,
            name: d2User.displayName,
            username,
            userGroups: d2User.userGroups,
            userRoles,
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
}
