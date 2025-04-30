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
        if (this.readBy.some(read => read.id === user.id)) {
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
    ANDROID: "ANDROID",
    WEB: "WEB",
    Both: "Both",
} as const;

export type NotificationWildcardType = keyof typeof NotificationWildcard;
