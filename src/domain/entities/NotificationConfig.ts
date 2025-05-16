import { NamedRef } from "./Ref";

export interface NotificationConfig {
    permissions: {
        users: NamedRef[];
        userGroups: NamedRef[];
    };
}
