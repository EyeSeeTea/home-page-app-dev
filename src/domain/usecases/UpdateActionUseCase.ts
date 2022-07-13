import { Action } from "../entities/Action";
import { ActionRepository } from "../repositories/ActionRepository";
import { UseCase } from "./UseCase";

export class UpdateActionUseCase implements UseCase {
    constructor(private ActionRepository: ActionRepository) {}

    public async execute(builder: Action): Promise<void> {
        return this.ActionRepository.update(builder);
    }
}
