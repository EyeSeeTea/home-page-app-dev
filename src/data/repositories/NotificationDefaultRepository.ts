import { Notification } from "../../domain/entities/Notification";
import { ListNotificationFilters, NotificationRepository } from "../../domain/repositories/NotificationRepository";
import { FutureData } from "../../domain/types/Future";
import { Config } from "../entities/Config";
import { StorageClient } from "../clients/storage/StorageClient";
import { Namespaces } from "../clients/storage/Namespaces";
import { Future } from "../../domain/types/Future";
import { fromPromise } from "../api-futures";
import { DataStoreStorageClient } from "../clients/storage/DataStoreStorageClient";

export class NotificationDefaultRepository implements NotificationRepository {
    private storageClient: StorageClient;
    private readonly namespace = Namespaces.NOTIFICATIONS;

    constructor(private config: Config) {
        this.storageClient = new DataStoreStorageClient({
            type: "global",
            instance: config.instance,
            namespace: this.namespace,
        });
    }

    list(options?: ListNotificationFilters): FutureData<Notification[]> {
        return fromPromise(this.storageClient.listObjectsInCollection<Notification>(this.namespace))
            .flatMapError(error => {
                console.error("Failed to list notifications:", error);
                return Future.error("Could not retrieve notifications from storage");
            })
            .map(notifications => {
                if (!options?.wildcard) return notifications;
                return notifications
                    .filter(notification => options.wildcard?.includes(notification.recipients.wildcard))
                    .map(notification => Notification.create(notification));
            });
    }

    save(notification: Notification): FutureData<void> {
        return fromPromise(this.storageClient.saveObjectInCollection(this.namespace, notification)).flatMapError(
            error => {
                console.error("Failed to save notification:", error);
                return Future.error("Could not save notification to storage");
            }
        );
    }
}
