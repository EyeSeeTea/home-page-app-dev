import { LandingPagePermission, Permission } from "./Permission";

export type SettingsAttrs = {
    // Move to Permissions entity
    landingPagePermissions: LandingPagePermission[];
    permissions: Permission;
    //
    analytics: { googleAnalyticsCode: string; matomoUrl: string };
    showAllActions: boolean;
    defaultApplication: string;
};

export type AnalyticsProperty = keyof Settings["analytics"];

export class Settings {
    public readonly landingPagePermissions: LandingPagePermission[];
    public readonly permissions: Permission;
    public readonly analytics: { googleAnalyticsCode: string; matomoUrl: string };
    public readonly showAllActions: boolean;
    public readonly defaultApplication: string;

    constructor(data: SettingsAttrs) {
        const { landingPagePermissions, permissions, analytics, showAllActions, defaultApplication } = data;
        this.landingPagePermissions = landingPagePermissions;
        this.permissions = permissions;
        this.analytics = analytics;
        this.showAllActions = showAllActions;
        this.defaultApplication = defaultApplication;
    }

    updateDefaultApplication(defaultApplication: string): Settings {
        return new Settings({ ...this, defaultApplication });
    }

    updateAnalytics(value: string, attributeName: keyof SettingsAttrs["analytics"]): Settings {
        return new Settings({ ...this, analytics: { ...this.analytics, [attributeName]: value } });
    }

    updateShowAllActions(value: boolean): Settings {
        return new Settings({ ...this, showAllActions: value });
    }

    updateLandingPagePermissions(
        landingPagePermissions: LandingPagePermission[],
        updatedPermissions: LandingPagePermission
    ): Settings {
        return new Settings({
            ...this,
            landingPagePermissions: landingPagePermissions.map(landing =>
                landing.id === updatedPermissions.id ? updatedPermissions : landing
            ),
        });
    }

    static initialData(): Settings {
        return new Settings({
            landingPagePermissions: [{ id: "", publicAccess: "r-------", userGroups: [], users: [] }],
            permissions: {},
            analytics: { googleAnalyticsCode: "", matomoUrl: "" },
            showAllActions: false,
            defaultApplication: "",
        });
    }
}
