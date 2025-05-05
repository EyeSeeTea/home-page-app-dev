import { NamedRef } from "./Ref";
import { Struct } from "./generic/Struct";
import { User } from "./User";

export type NotificationAttrs = {
    id: string;
    content: string;
    recipients: NotificationRecipients;
    readBy: UserReadNotification[];
    createdAt: Date;
};

export class Notification extends Struct<NotificationAttrs>() {
    markAsRead(user: User): Notification {
        if (this.isReadBy(user)) {
            return this;
        } else {
            return this._update({
                readBy: [
                    ...this.readBy,
                    {
                        id: user.id,
                        name: user.name,
                        date: new Date(),
                    },
                ],
            });
        }
    }

    isReadBy(user: User): boolean {
        return this.readBy.some(read => read.id === user.id);
    }
}

type NotificationRecipients = {
    users: NamedRef[];
    userGroups: NamedRef[];
    wildcard: NotificationWildcardType;
};

type UserReadNotification = {
    id: string;
    name: string;
    date: Date;
};

export const NotificationWildcard = {
    ALL: "ALL",
    ANDROID: "android",
    WEB: "web",
    Both: "both",
} as const;

export type NotificationWildcardType = typeof NotificationWildcard[keyof typeof NotificationWildcard];
