import { UseCase } from "../../CompositionRoot";
import { FutureData } from "../types/Future";
import { InstanceRepository } from "../repositories/InstanceRepository";

export class GetInstanceVersionUseCase implements UseCase {
    constructor(private instanceRepository: InstanceRepository) {}

    public execute(): FutureData<string> {
        return this.instanceRepository.getInstanceVersion();
    }
}
