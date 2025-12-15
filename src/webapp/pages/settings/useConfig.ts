import compact from "lodash/compact";
import { useState, useEffect, useCallback, useMemo } from "react";
import { PermissionHandlerProps, SharedUpdate } from "../../components/permissions-dialog/PermissionsDialog";
import { useAppContext } from "../../contexts/app-context";
import { User } from "../../../domain/entities/User";
import { Maybe } from "../../../types/utils";
import { LandingNode, updateLandings } from "../../../domain/entities/LandingNode";
import { AnalyticsConfig } from "../../../domain/entities/AnalyticsConfig";
import { GoogleAnalytics } from "../../utils/GoogleAnalytics";
import { MatomoAnalytics } from "../../utils/matomo";
import { AnalyticsEvent, sendAnalyticsEvents, SendAnalyticsEventType } from "../../utils/analytics";
import i18n from "../../../utils/i18n";
import { useAccessPermissionsDialog } from "./useAccessPermissionsDialog";
import { Settings } from "../../../domain/entities/Settings";
import { emptySettings } from "../../../data/repositories/SettingsDatastoreRepository";

type UseConfigPloc = {
    settingPermissionsDialogProps: PermissionHandlerProps;
    settings: Settings;
    user?: User;
    userLandings: Maybe<LandingNode[]>;
    updateAnalyticsConfig: (config: AnalyticsConfig) => Promise<void>;
    updateDefaultApplication: (value: string) => void;
    updateLandingPagePermissions: (sharedUpdate: SharedUpdate, id: string) => Promise<void>;
    updateShowAllActions: (value: boolean) => void;
    trackViews: SendAnalyticsEventType;
};

export function useConfig(): UseConfigPloc {
    const { compositionRoot, currentUser, landings } = useAppContext();

    const [settings, setSettings] = useState<Settings>(emptySettings);

    const userLandings = useMemo<LandingNode[] | undefined>(() => {
        if (!landings || settings.landingPagePermissions.length === 0 || !currentUser) return undefined;
        return updateLandings(landings, settings.landingPagePermissions, currentUser);
    }, [settings, landings, currentUser]);

    useEffect(() => {
        compositionRoot.config.getSettings().run(
            settings => setSettings(settings),
            error => console.error(error)
        );
    }, [compositionRoot.config]);

    const updateDefaultApplication = useCallback(
        (value: string) => {
            const updatedSettings = settings.updateDefaultApplication(value);
            compositionRoot.config.saveSettings(updatedSettings).run(
                () => setSettings(updatedSettings),
                error => console.error(error)
            );
        },
        [compositionRoot.config, settings]
    );

    const updateAnalyticsConfig = useCallback(
        async (config: AnalyticsConfig) => {
            const { googleAnalyticsCode, matomoUrl } = settings.analyticsConfig;
            const updatedSettings = settings.updateAnalyticsConfig({
                googleAnalyticsCode:
                    config.googleAnalyticsCode !== undefined ? config.googleAnalyticsCode : googleAnalyticsCode,
                matomoUrl: config.matomoUrl !== undefined ? config.matomoUrl : matomoUrl,
            });

            await compositionRoot.config
                .saveSettings(updatedSettings)
                .runAsync()
                .then(() => setSettings(updatedSettings));
        },
        [compositionRoot.config, settings]
    );

    const updateLandingPagePermissions = useCallback(
        async ({ userAccesses, userGroupAccesses, publicAccess: publicAccessValue }: SharedUpdate, id: string) => {
            const existingPermission = settings.landingPagePermissions.find(landing => landing.id === id);
            const { users = [], userGroups = [], publicAccess = "r-------" } = existingPermission ?? {};

            const updatedPermission = {
                id,
                userGroups: userGroupAccesses ?? userGroups,
                users: userAccesses ?? users,
                publicAccess: publicAccessValue ?? publicAccess,
            };

            const updatedLandingPagePermissions = existingPermission
                ? settings.landingPagePermissions.map(landing => (landing.id === id ? updatedPermission : landing))
                : [...settings.landingPagePermissions, updatedPermission];

            const updatedSettings = settings.updateLandingPagePermissions(updatedLandingPagePermissions);
            compositionRoot.config.saveSettings(updatedSettings).run(
                () => setSettings(updatedSettings),
                error => console.error(error)
            );
        },
        [compositionRoot.config, settings]
    );

    const updateSettingsPermissions = useCallback(
        ({ userAccesses, userGroupAccesses }: SharedUpdate) => {
            const { users = [], userGroups = [] } = settings.settingsPermissions;
            const updatedSettings = settings.updateSettingsPermissions({
                users: userAccesses ?? users,
                userGroups: userGroupAccesses ?? userGroups,
            });

            compositionRoot.config.saveSettings(updatedSettings).run(
                () => setSettings(updatedSettings),
                error => console.error(error)
            );
        },
        [compositionRoot.config, settings]
    );

    const updateShowAllActions = useCallback(
        (value: boolean) => {
            const updatedSettings = settings.updateShowAllActions(value);
            compositionRoot.config.saveSettings(updatedSettings).run(
                () => setSettings(updatedSettings),
                error => console.error(error)
            );
        },
        [compositionRoot.config, settings]
    );

    const trackViews = useCallback(
        (event: AnalyticsEvent) => {
            const googleAnalytics = settings.analyticsConfig?.googleAnalyticsCode
                ? new GoogleAnalytics(settings.analyticsConfig.googleAnalyticsCode)
                : undefined;
            const matomoAnalytics = settings.analyticsConfig?.matomoUrl
                ? new MatomoAnalytics(settings.analyticsConfig.matomoUrl)
                : undefined;

            const analyticsTrackers = compact([googleAnalytics, matomoAnalytics]);
            sendAnalyticsEvents({ analyticsTrackers, event });
        },
        [settings]
    );

    const permissionDialogProps: PermissionHandlerProps = useAccessPermissionsDialog({
        permissions: settings.settingsPermissions,
        updatePermissions: updateSettingsPermissions,
        name: i18n.t("Access to settings"),
    });

    return {
        settingPermissionsDialogProps: permissionDialogProps,
        settings: settings,
        user: currentUser,
        userLandings: userLandings,
        trackViews,
        updateAnalyticsConfig,
        updateDefaultApplication,
        updateLandingPagePermissions,
        updateShowAllActions,
    };
}
