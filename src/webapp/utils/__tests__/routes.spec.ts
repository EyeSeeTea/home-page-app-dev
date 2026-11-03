import { isCrossOriginUrl, isSelfLaunchPath } from "../routes";

describe("isCrossOriginUrl", () => {
    const currentHref = "https://cpr.example.org/api/apps/Homepage-App/index.html#/";

    it("returns true for an external site", () => {
        expect(isCrossOriginUrl("https://learn.example.org/totara/dashboard/index.php", currentHref)).toBe(true);
    });

    it("returns true for the same host on another scheme", () => {
        expect(isCrossOriginUrl("http://cpr.example.org/dhis-web-dashboard/", currentHref)).toBe(true);
    });

    it("returns false for an absolute URL on the same origin", () => {
        expect(isCrossOriginUrl("https://cpr.example.org/dhis-web-dashboard/", currentHref)).toBe(false);
    });

    it("returns false for a relative URL", () => {
        expect(isCrossOriginUrl("/api/apps/Staff/index.html", currentHref)).toBe(false);
    });
});

const homepageAppLegacyPath = "/api/apps/Homepage-App/index.html";
const homepageAppGlobalShellPath = "/apps/Homepage-App/index.html";

describe("isSelfLaunchPath", () => {
    describe("when the candidate points at the current app", () => {
        it("matches an exact full launch path", () => {
            expect(isSelfLaunchPath(homepageAppLegacyPath, homepageAppLegacyPath)).toBe(true);
        });

        it("matches when the current path carries a context-path prefix the candidate lacks", () => {
            expect(isSelfLaunchPath(homepageAppLegacyPath, `/dhis${homepageAppLegacyPath}`)).toBe(true);
        });

        it("matches the Global Shell form when both sides use it", () => {
            expect(isSelfLaunchPath(homepageAppGlobalShellPath, homepageAppGlobalShellPath)).toBe(true);
        });

        it("ignores a trailing slash on the candidate", () => {
            expect(isSelfLaunchPath(`${homepageAppLegacyPath}/`, homepageAppLegacyPath)).toBe(true);
        });

        it("ignores a trailing # on the current path", () => {
            expect(isSelfLaunchPath(homepageAppLegacyPath, `${homepageAppLegacyPath}#`)).toBe(true);
        });
    });

    describe("when the candidate does not point at the current app", () => {
        it("returns false for an empty candidate", () => {
            expect(isSelfLaunchPath("", homepageAppLegacyPath)).toBe(false);
        });

        it("returns false for a different app's path", () => {
            expect(isSelfLaunchPath("/dhis-web-dashboard/index.html", homepageAppLegacyPath)).toBe(false);
        });

        it("returns false when the candidate is only the app's short base path", () => {
            expect(isSelfLaunchPath("/apps/Homepage-App", homepageAppGlobalShellPath)).toBe(false);
        });
    });
});
