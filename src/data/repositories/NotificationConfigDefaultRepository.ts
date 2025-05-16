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
        return this.getConfig().map(config => config ?? this.getDefaultConfig());
    }

    save(config: NotificationConfig): FutureData<void> {
        return this.saveConfig(config);
    }

    private getConfig(): FutureData<NotificationConfig | undefined> {
        return fromPromise(this.storageClient.getObject<NotificationConfig>(this.key))
            .flatMapError(error => this.handleStorageError("get notification config", error));
    }

    private saveConfig(config: NotificationConfig): FutureData<void> {
        return fromPromise(this.storageClient.saveObject(this.key, config))
            .flatMapError(error => this.handleStorageError("save notification config", error));
    }

    private handleStorageError(operation: string, error: string): FutureData<never> {
        console.error(`Failed to ${operation}:`, error);
        return Future.error(`${i18n.t(`Could not ${operation} from storage`)}\n${error}`);
    }

    private getDefaultConfig(): NotificationConfig {
        return {
            permissions: {
                users: [],
                userGroups: [],
            },
        };
    }
}
