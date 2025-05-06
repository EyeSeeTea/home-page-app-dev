import { NamedRef, SharedProperties } from "./Ref";
import { Struct } from "./generic/Struct";
import { User } from "./User";

export type NotificationAttrs = {
    id: string;
    content: string;
    recipients: NotificationRecipients;
    readBy: UserReadNotification[];
    createdAt: Date;
    permissions: SharedProperties;
    userId: string;
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

    canView(user: User) {
        return this.checkPermissionAccess(user, "r");
    }

    canEdit(user: User) {
        return this.checkPermissionAccess(user, "rw");
    }

    private checkPermissionAccess(user: User, accessType: "r" | "rw"): boolean {
        if (this.userId === user.id) return true;

        const userPermission = this.permissions.userAccesses.find(permission => permission.id === user.id);

        const groupPermissions = this.permissions.userGroupAccesses.filter(group =>
            user.userGroups.some(userGroup => userGroup.id === group.id)
        );

        return (
            this.hasAccess(this.permissions.publicAccess, accessType) ||
            this.hasAccess(userPermission?.access || "", accessType) ||
            groupPermissions.some(permission => this.hasAccess(permission.access, accessType))
        );
    }

    private hasAccess(accessString: string, accessType: "r" | "rw") {
        return accessString.substring(0, 2).includes(accessType);
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

export type NotificationConfig = {
    permissions: {
        users: NamedRef[];
        userGroups: NamedRef[];
    };
};
