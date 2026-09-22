import { normalizeAppPath } from "../../utils/urls";

export function goTo(url: string, options: { baseUrl: string }) {
    const isUrlAbsolute = url.startsWith("http://") || url.startsWith("https://");
    const href = isUrlAbsolute ? url : options.baseUrl + url;
    window.location.href = href;
}

// True when candidatePath resolves to the app currently running at currentPath
// (this app's own launch path, in whichever form DHIS2 used to launch it).
export function isSelfLaunchPath(candidatePath: string, currentPath: string): boolean {
    const normalizedCandidate = normalizeAppPath(candidatePath);
    if (!normalizedCandidate) return false;

    return normalizeAppPath(currentPath).endsWith(normalizedCandidate);
}
