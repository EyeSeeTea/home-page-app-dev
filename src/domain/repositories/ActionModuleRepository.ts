import { PersistedAction } from "../../data/entities/PersistedAction";
import { Action } from "../entities/Action";

export interface TrainingModuleRepository {
    list(): Promise<Action[]>;
    get(moduleKey: string): Promise<Action | undefined>;
    update(module: Pick<Action, "id" | "name"> & Partial<Action>): Promise<void>;
    delete(ids: string[]): Promise<void>;
    swapOrder(id1: string, id2: string): Promise<void>;
    updateProgress(id: string, lastStep: number, completed: boolean): Promise<void>;
    exportTranslations(key: string): Promise<void>;
    importTranslations(key: string, language: string, terms: Record<string, string>): Promise<number>;
    resetDefaultValue(ids: string[]): Promise<void>;
    export(ids: string[]): Promise<void>;
    import(files: File[]): Promise<PersistedAction[]>;
}
