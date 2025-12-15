import { AnalyticsConfig } from "./AnalyticsConfig";
import { Struct } from "./generic/Struct";
import { LandingPagePermission, Permission } from "./Permission";

export type SettingsAttrs = {
    analyticsConfig: AnalyticsConfig;
    defaultApplication: string;
    landingPagePermissions: LandingPagePermission[];
    settingsPermissions: Permission;
    showAllActions: boolean;
};

export class Settings extends Struct<SettingsAttrs>() {
    updateAnalyticsConfig(analyticsConfig: AnalyticsConfig): Settings {
        return this._update({ analyticsConfig });
    }

    updateDefaultApplication(defaultApplication: string): Settings {
        return this._update({ defaultApplication });
    }

    updateLandingPagePermissions(landingPagePermissions: LandingPagePermission[]): Settings {
        return this._update({ landingPagePermissions });
    }

    updateSettingsPermissions(settingsPermissions: Permission): Settings {
        return this._update({ settingsPermissions });
    }

    updateShowAllActions(showAllActions: boolean): Settings {
        return this._update({ showAllActions });
    }
}
