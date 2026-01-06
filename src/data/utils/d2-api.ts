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

export function isAppInstalledByUrl(launchPath: string, installedApps: InstalledApp[]): boolean {
    const isPathRelative = launchPath.startsWith("/");
    if (!isPathRelative) return false;

    // Normalize by removing trailing /, #, #/, /#
    const normalizePath = (path: string) => path.replace(/[/#]+$/, "")
    const normalizedLaunchPath = normalizePath(launchPath);

    return installedApps.some(app => {
        if (!app.launchUrl) return false;
        return normalizePath(app.launchUrl).endsWith(normalizedLaunchPath);
    });

}

export async function getVersion(api: D2Api): Promise<string> {
    const { version } = await api.system.info.getData();
    return version;
}
