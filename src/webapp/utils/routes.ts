import { normalizeAppPath } from "../../utils/urls";

export function goTo(url: string, options: { baseUrl: string }) {
    const isUrlAbsolute = url.startsWith("http://") || url.startsWith("https://");
    const href = isUrlAbsolute ? url : options.baseUrl + url;
    navigateTo(href);
}

// The DHIS2 Global Shell (2.41+) runs the app in an iframe, and external sites usually refuse
// to be framed (X-Frame-Options), so cross-origin URLs replace the top window instead.
export function navigateTo(href: string): void {
    const topWindow = window.top;

    if (topWindow && topWindow !== window.self && isCrossOriginUrl(href, window.location.href)) {
        topWindow.location.href = href;
    } else {
        window.location.href = href;
    }
}

export function isCrossOriginUrl(href: string, currentHref: string): boolean {
    try {
        return new URL(href, currentHref).origin !== new URL(currentHref).origin;
    } catch {
        return false;
    }
}

// True when candidatePath resolves to the app currently running at currentPath
// (this app's own launch path, in whichever form DHIS2 used to launch it).
export function isSelfLaunchPath(candidatePath: string, currentPath: string): boolean {
    const normalizedCandidate = normalizeAppPath(candidatePath);
    if (!normalizedCandidate) return false;

    return normalizeAppPath(currentPath).endsWith(normalizedCandidate);
}
