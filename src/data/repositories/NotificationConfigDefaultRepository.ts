import { NotificationConfig } from "../../domain/entities/NotificationConfig";
import { NotificationConfigRepository } from "../../domain/repositories/NotificationConfigRepository";
import { FutureData } from "../../domain/types/Future";
import { Config } from "../entities/Config";
import { StorageClient } from "../clients/storage/StorageClient";
import { Namespaces } from "../clients/storage/Namespaces";
import { Future } from "../../domain/types/Future";
import { fromPromise } from "../api-futures";
import { DataStoreStorageClient } from "../clients/storage/DataStoreStorageClient";
import i18n from "../../utils/i18n";

export class NotificationConfigDefaultRepository implements NotificationConfigRepository {
    private storageClient: StorageClient;
    private readonly namespace = Namespaces.NOTIFICATIONS;
    private readonly key = Namespaces.CONFIG;

    constructor(private config: Config) {
        this.storageClient = new DataStoreStorageClient({
            type: "global",
            instance: config.instance,
            namespace: this.namespace,
        });
    }

    get(): FutureData<NotificationConfig> {
        return fromPromise(this.storageClient.getObject<NotificationConfig>(this.key))
            .flatMapError(error => {
                console.error("Failed to get notification config:", error);
                return Future.error(`${i18n.t("Could not retrieve notification config from storage")}\n${error}`);
            })
            .map(config => config ?? { permissions: { users: [], userGroups: [] } });
    }

    save(config: NotificationConfig): FutureData<void> {
        return fromPromise(this.storageClient.saveObject(this.key, config)).flatMapError(error => {
            console.error("Failed to save notification config:", error);
            return Future.error(`${i18n.t("Could not save notification config to storage")}\n${error}`);
        });
    }
}
