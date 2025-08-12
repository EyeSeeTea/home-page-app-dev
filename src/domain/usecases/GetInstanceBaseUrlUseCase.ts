import { UseCase } from "./UseCase";
import { InstanceRepository } from "../repositories/InstanceRepository";

export class GetInstanceBaseUrlUseCase implements UseCase {
    constructor(private instanceRepository: InstanceRepository) {}

    public execute(): string {
        return this.instanceRepository.getBaseUrl();
    }
}
