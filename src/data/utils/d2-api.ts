import _ from "lodash";
import { D2Api } from "../../types/d2-api";
import { Instance } from "../entities/Instance";
import { InstalledApp } from "../../domain/entities/InstalledApp";

export function getMajorVersion(version: string): number {
    const apiVersion = _.get(version.split("."), 1);
    if (!apiVersion) throw new Error(`Invalid version: ${version}`);
    return Number(apiVersion);
}

export function getD2APiFromInstance(instance: Instance): D2Api {
    return new D2Api({ baseUrl: instance.url, auth: instance.auth, backend: "fetch" });
}

export function isAppInstalledByUrl(launchUrl: string, installedApps: InstalledApp[]): boolean {
    const isUrlRelative = launchUrl.startsWith("/");
    if (!isUrlRelative) return false;

    return installedApps.some(app => app.launchUrl.endsWith(launchUrl));
}

export async function getVersion(api: D2Api): Promise<string> {
    const { version } = await api.system.info.getData();
    return version;
}
