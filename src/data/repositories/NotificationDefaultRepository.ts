import { Notification } from "../../domain/entities/Notification";
import { ListNotificationFilters, NotificationRepository } from "../../domain/repositories/NotificationRepository";
import { FutureData } from "../../domain/types/Future";
import { Config } from "../entities/Config";
import { StorageClient } from "../clients/storage/StorageClient";
import { Namespaces } from "../clients/storage/Namespaces";
import { Future } from "../../domain/types/Future";
import { fromPromise } from "../api-futures";
import { DataStoreStorageClient } from "../clients/storage/DataStoreStorageClient";
import i18n from "../../utils/i18n";

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
        return this.listNotifications().map(notifications =>
            this.filterNotificationsByWildcard(notifications, options?.wildcard)
        );
    }

    save(notification: Notification): FutureData<void> {
        return this.saveNotification(notification);
    }

    private listNotifications(): FutureData<Notification[]> {
        return fromPromise(this.storageClient.listObjectsInCollection<Notification>(this.namespace))
            .map(notifications => notifications.map(notif => Notification.create(notif)))
            .flatMapError(error => this.handleStorageError("list notifications", error));
    }

    private saveNotification(notification: Notification): FutureData<void> {
        return fromPromise(this.storageClient.saveObjectInCollection(this.namespace, notification)).flatMapError(
            error => this.handleStorageError("save notification", error)
        );
    }

    private handleStorageError(operation: string, error: string): FutureData<never> {
        console.error(`Failed to ${operation}:`, error);
        return Future.error(`${i18n.t(`Could not ${operation}`)}\n${error}`);
    }

    private filterNotificationsByWildcard(
        notifications: Notification[],
        wildcardFilter?: ListNotificationFilters["wildcard"]
    ): Notification[] {
        if (!wildcardFilter) return notifications;

        return notifications.filter(notification => wildcardFilter.includes(notification.recipients.wildcard));
    }
}
