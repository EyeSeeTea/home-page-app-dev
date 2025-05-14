import { NamedRef } from "./Ref";
import { Struct } from "./generic/Struct";

export const NotificationWildcard = {
    ALL: "ALL",
    ANDROID: "android",
    WEB: "web", 
    BOTH: "both"
} as const;

export type NotificationWildcard = typeof NotificationWildcard[keyof typeof NotificationWildcard];

export type NotificationRead = {
    date: Date;
    id: string;
    name: string;
};

export type NotificationRecipients = {
    userGroups: NamedRef[];
    users: NamedRef[];
    wildcard: NotificationWildcard;
};

export type NotificationAttributes = {
    id: string;
    content: string;
    createdAt: Date;
    readBy: NotificationRead[];
    recipients: NotificationRecipients;
};

export class Notification extends Struct<NotificationAttributes>() {
    markAsRead(user: NamedRef): Notification {
        const alreadyRead = this.readBy.some(read => read.id === user.id);
        if (alreadyRead) return this;

        const newReadBy = [...this.readBy, { date: new Date(), id: user.id, name: user.name }];

        return this._update({ readBy: newReadBy });
    }

    isReadBy(userId: string): boolean {
        return this.readBy.some(read => read.id === userId);
    }
}
