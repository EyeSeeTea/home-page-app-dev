import { NamedRef, SharedProperties } from "./Ref";
import { Struct } from "./generic/Struct";
import { isSuperAdmin, User } from "./User";

export const notificationWildcard = {
    ALL: "ALL",
    ANDROID: "android",
    WEB: "web",
    BOTH: "both",
} as const;

export type NotificationWildcard = typeof notificationWildcard[keyof typeof notificationWildcard];

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
    createdBy: NamedRef;
    readBy: NotificationRead[];
    recipients: NotificationRecipients;
    permissions: SharedProperties;
};

export class Notification extends Struct<NotificationAttributes>() {
    markAsRead(user: User): Notification {
        const alreadyRead = this.readBy.some(read => read.id === user.id);
        if (alreadyRead) return this;

        const newReadBy = [...this.readBy, { date: new Date(), id: user.id, name: user.name }];

        return this._update({ readBy: newReadBy });
    }

    isReadBy(userId: string): boolean {
        return this.readBy.some(read => read.id === userId);
    }

    private hasAccess(user: User, requiredAccess: "r" | "w"): boolean {
        if (isSuperAdmin(user)) return true;
        if (this.createdBy.id === user.id) return true;

        const publicAccess = this.permissions.publicAccess;
        if (publicAccess.startsWith(requiredAccess)) return true;

        const userAccess = this.permissions.userAccesses?.find(access => access.id === user.id);
        if (userAccess?.access.startsWith(requiredAccess)) return true;

        const userGroupAccess = this.permissions.userGroupAccesses?.some(groupAccess =>
            user.userGroups.some(
                userGroup => userGroup.id === groupAccess.id && groupAccess.access.startsWith(requiredAccess)
            )
        );
        if (userGroupAccess) return true;

        return false;
    }

    canView(user: User): boolean {
        return this.hasAccess(user, "r");
    }

    canEdit(user: User): boolean {
        return this.hasAccess(user, "w");
    }
}
