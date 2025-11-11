import { D2Api } from "@eyeseetea/d2-api/2.34";
import { FutureData } from "../../domain/types/Future";
import { User } from "../../domain/entities/User";
import { cache } from "../../utils/cache";
import { getD2APiFromInstance } from "../../utils/d2-api";
import { apiToFuture } from "../api-futures";
import { Instance } from "../entities/Instance";
import { UserRepository } from "../../domain/repositories/UserRepository";

export class UserApiRepository implements UserRepository {
    private api: D2Api;

    constructor(instance: Instance) {
        this.api = getD2APiFromInstance(instance);
    }

    @cache()
    public getCurrentUser(): FutureData<User> {
        return apiToFuture(
            this.api.currentUser.get({
                fields: {
                    id: true,
                    displayName: true,
                    // v42+: authorities and username may be top-level on /me
                    authorities: true,
                    username: true,
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
            username: (user as any).username ?? user.userCredentials?.username ?? "",
            userGroups: user.userGroups,
            userRoles:
                user.userCredentials?.userRoles ??
                (user.authorities
                    ? [{ id: "authorities", name: "authorities", authorities: user.authorities }]
                    : []),
        } as User));
    }
}
