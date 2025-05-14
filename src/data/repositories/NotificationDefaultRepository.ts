import _ from "lodash";

import { NotificationListOptions, NotificationRepository } from "../../domain/repositories/NotificationRepository";
import { Future, FutureData } from "../../domain/types/Future";
import {
    Notification,
    NotificationConfig,
    NotificationWildcard,
    NotificationWildcardType,
} from "../../domain/entities/Notification";
import { Instance } from "../entities/Instance";
import { DataStoreStorageClient } from "../clients/storage/DataStoreStorageClient";
import { notificationKeys, notificationsNamespace } from "../clients/storage/Namespaces";
import { StorageClient } from "../clients/storage/StorageClient";
import { Maybe } from "../../types/utils";
import i18n from "../../utils/i18n";

export class NotificationDefaultRepository implements NotificationRepository {
    private storageClient: StorageClient;

    constructor(instance: Instance) {
        this.storageClient = new DataStoreStorageClient({
            type: "global",
            instance: instance,
            namespace: notificationsNamespace,
        });
    }

    public list(options?: NotificationListOptions): FutureData<Notification[]> {
        return this._get().map(notifications => this.filterNotifications(notifications, options));
    }

    public save(notifications: Notification[]): FutureData<void> {
        return this._save(notifications);
    }

    public delete(notifications: Notification[]): FutureData<void> {
        return this._delete(notifications);
    }

    public getConfig(): FutureData<NotificationConfig> {
        return this._getConfig();
    }

    public saveConfig(config: NotificationConfig): FutureData<void> {
        return this._saveConfig(config);
    }

    private _get(): FutureData<Notification[]> {
        return Future.fromPromise(
            this.storageClient.listObjectsInCollection<Notification>(notificationKeys.NOTIFICATIONS)
        )
            .flatMap(notifications =>
                Future.parallel(notifications.map(notification => Notification.tryCreate(notification)))
            )
            .flatMapError(error => {
                console.error(`Notification (list): ${error}`);
                return Future.error(
                    i18n.t("An error has occurred fetching notifications\n{{error}}", { error: String(error) })
                );
            });
    }

    private _save(notifications: Notification[]): FutureData<void> {
        return Future.fromPromise(
            this.storageClient.saveObjectsInCollection<Notification>(notificationKeys.NOTIFICATIONS, notifications)
        ).flatMapError(error => {
            console.error(`Notification (save): ${error}`);
            return Future.error(
                i18n.t("An error has occurred while saving notifications\n{{error}}", { error: String(error) })
            );
        });
    }

    private _delete(notifications: Notification[]): FutureData<void> {
        return Future.fromPromise(
            this.storageClient.removeObjectsInCollection(
                notificationsNamespace,
                notifications.map(notification => notification.id)
            )
        ).flatMapError(error => {
            console.error(`Notification (remove): ${error}`);
            return Future.error(
                i18n.t("An error has occurred deleting notifications\n{{error}}", { error: String(error) })
            );
        });
    }

    private filterNotifications(notifications: Notification[], options?: NotificationListOptions): Notification[] {
        return _(notifications)
            .filter(notification => this.isValidWildcard(notification, options?.wildcard))
            .value();
    }

    private isValidWildcard(notification: Notification, wildcardOptions: Maybe<NotificationWildcardType[]>): boolean {
        return (
            !notification.recipients.wildcard ||
            !wildcardOptions ||
            [NotificationWildcard.ALL, ...wildcardOptions].includes(notification.recipients.wildcard)
        );
    }

    private _getConfig(): FutureData<NotificationConfig> {
        return Future.fromPromise(this.storageClient.getObject<NotificationConfig>(notificationKeys.CONFIG))
            .map(config => config || { permissions: { users: [], userGroups: [] } })
            .flatMapError(error => {
                console.error(`Notification (getConfig): ${error}`);
                return Future.error(
                    i18n.t("An error has occurred fetching notification config\n{{error}}", { error: String(error) })
                );
            });
    }

    private _saveConfig(config: NotificationConfig): FutureData<void> {
        return Future.fromPromise(
            this.storageClient.saveObject<NotificationConfig>(notificationKeys.CONFIG, config)
        ).flatMapError(error => {
            console.error(`Notification (saveConfig): ${error}`);
            return Future.error(
                i18n.t("An error has occurred saving notification config\n{{error}}", { error: String(error) })
            );
        });
    }
}
