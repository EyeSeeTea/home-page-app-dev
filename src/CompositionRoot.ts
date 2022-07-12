import { Instance } from "./data/entities/Instance";
import { InstanceDhisRepository } from "./data/repositories/InstanceDhisRepository";
import { UserApiRepository } from "./data/repositories/UserApiRepository";
import { GetCurrentUserUseCase } from "./domain/usecases/GetCurrentUserUseCase";
import { GetInstanceVersionUseCase } from "./domain/usecases/GetInstanceVersionUseCase";

export function getCompositionRoot(instance: Instance) {
    const userRepository = new UserApiRepository(instance);
    const instanceRepository = new InstanceDhisRepository(instance);

    return {
        instance: getExecute({
            getCurrentUser: new GetCurrentUserUseCase(userRepository),
            getVersion: new GetInstanceVersionUseCase(instanceRepository),
        }),
    };
}

export type CompositionRoot = ReturnType<typeof getCompositionRoot>;

function getExecute<UseCases extends Record<Key, UseCase>, Key extends keyof UseCases>(
    useCases: UseCases
): { [K in Key]: UseCases[K]["execute"] } {
    const keys = Object.keys(useCases) as Key[];
    const initialOutput = {} as { [K in Key]: UseCases[K]["execute"] };

    return keys.reduce((output, key) => {
        const useCase = useCases[key];
        const execute = useCase.execute.bind(useCase) as UseCases[typeof key]["execute"];
        output[key] = execute;
        return output;
    }, initialOutput);
}

export interface UseCase {
    execute: Function;
}
