import { Config } from "../../data/entities/Config";

export interface ConfigRepository {
    get(): Promise<Config>;
}
