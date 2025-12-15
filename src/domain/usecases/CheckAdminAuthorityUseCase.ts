import { UseCase } from "./UseCase";
import { Config } from "../../data/entities/Config";

export class CheckAdminAuthorityUseCase implements UseCase {
    constructor(private config: Config) {}

    public async execute(): Promise<boolean> {
        const user = this.config.currentUser;

        return !!user.userRoles.find(role => role.authorities.find(authority => authority === "ALL"));
    }
}
