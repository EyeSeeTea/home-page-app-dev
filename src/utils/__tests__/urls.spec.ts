import { normalizeAppPath } from "../urls";

describe("normalizeAppPath", () => {
    it("leaves an already-normalized path untouched", () => {
        expect(normalizeAppPath("/api/apps/Homepage-App/index.html")).toBe("/api/apps/Homepage-App/index.html");
    });

    it("strips a trailing slash", () => {
        expect(normalizeAppPath("/apps/Homepage-App/")).toBe("/apps/Homepage-App");
    });

    it("strips a trailing #", () => {
        expect(normalizeAppPath("/apps/Homepage-App#")).toBe("/apps/Homepage-App");
    });

    it("strips a trailing #/", () => {
        expect(normalizeAppPath("/apps/Homepage-App#/")).toBe("/apps/Homepage-App");
    });

    it("strips a trailing /#", () => {
        expect(normalizeAppPath("/apps/Homepage-App/#")).toBe("/apps/Homepage-App");
    });

    it("strips everything after a #-fragment", () => {
        expect(normalizeAppPath("/apps/Homepage-App/index.html#/settings")).toBe("/apps/Homepage-App/index.html");
    });
});
