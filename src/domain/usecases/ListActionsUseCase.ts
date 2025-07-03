import _ from "lodash";
import { Action } from "../entities/Action";
import { ActionRepository } from "../repositories/ActionRepository";
import { UseCase } from "./UseCase";
import { User } from "../entities/User";

export class ListActionsUseCase implements UseCase {
    constructor(private actionRepository: ActionRepository) {}

    public async execute(user: User): Promise<Action[]> {
        const actions = await this.actionRepository.getAll();
        return actions.filter(({ dhisAuthorities }) => {
            const userAuthorities = user.userRoles.flatMap(({ authorities }) => authorities);

            return _.every(
                dhisAuthorities,
                authority => userAuthorities.includes("ALL") || userAuthorities.includes(authority)
            );
        });
    }
}
