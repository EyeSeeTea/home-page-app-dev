import { D2Api } from "../../types/d2-api";
import { FutureData } from "../../domain/types/Future";
import { User } from "../../domain/entities/User";
import { cache } from "../../utils/cache";
import { getD2APiFromInstance } from "../../utils/d2-api";
import { apiToFuture } from "../api-futures";
import { Instance } from "../entities/Instance";

export class D2ApiUser {
    private api: D2Api;

    constructor(instance: Instance) {
        this.api = getD2APiFromInstance(instance);
    }

    @cache()
    public getCurrentUser(): FutureData<User> {
        // dataStore permissions
        return apiToFuture(
            this.api.currentUser.get({
                fields: {
                    id: true,
                    displayName: true,
                    userGroups: { id: true, name: true },
                    userCredentials: {
                        username: true,
                        userRoles: { id: true, name: true, authorities: true },
                    },
                },
            })
        ).map(user => ({
            id: user.id,
            name: user.displayName,
            userGroups: user.userGroups,
            ...user.userCredentials,
        }));
    }
}
