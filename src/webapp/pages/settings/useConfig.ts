import _ from "lodash";
import React, { useCallback, useMemo } from "react";
import { LandingPagePermission, Permission } from "../../../domain/entities/Permission";
import { PermissionHandlerProps, SharedUpdate } from "../../components/permissions-dialog/PermissionsDialog";
import { useAppContext } from "../../contexts/app-context";
import { Maybe } from "../../../types/utils";
import { LandingNode, updateLandings } from "../../../domain/entities/LandingNode";
import { GoogleAnalytics } from "../../utils/GoogleAnalytics";
import { MatomoAnalytics } from "../../utils/matomo";
import { AnalyticsEvent, sendAnalyticsEvents, SendAnalyticsEventType } from "../../utils/analytics";
import i18n from "../../../utils/i18n";
import { useAccessPermissionsDialog } from "./useAccessPermissionsDialog";
import { AnalyticsProperty, Settings } from "../../../domain/entities/Settings";

type UseConfigPloc = {
    updateShowAllActions: (value: boolean) => void;
    updateDefaultApplication: (value: string) => void;
    updateLandingPagePermissions: (sharedUpdate: SharedUpdate, id: string) => Promise<void>;
    userLandings: Maybe<LandingNode[]>;
    updateAnalyticsConfig: (value: string, attribute: AnalyticsProperty) => Promise<void>;
    trackViews: SendAnalyticsEventType;
    settingPermissionsDialogProps: PermissionHandlerProps;
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
};

export function useConfig(): UseConfigPloc {
    const { landings, currentUser, settings, updateSettings } = useAppContext();

    const userLandings = useMemo<LandingNode[] | undefined>(() => {
        if (!(landings && settings.landingPagePermissions && currentUser)) return undefined;
        return updateLandings(landings, settings.landingPagePermissions, currentUser);
    }, [settings.landingPagePermissions, landings, currentUser]);

    const saveSettingsFn = useSaveSettings({ onSuccess: updateSettings, onError: console.error });

    const updateDefaultApplication = useCallback(
        async (value: string) => {
            const settingsToUpdate = settings.updateDefaultApplication(value);
            return saveSettingsFn(settingsToUpdate);
        },
        [saveSettingsFn, settings]
    );

    const updateAnalyticsConfig = useCallback(
        async (value: string, attributeName: AnalyticsProperty) => {
            return saveSettingsFn(settings.updateAnalytics(value, attributeName));
        },
        [settings, saveSettingsFn]
    );

    const updateLandingPagePermissions = useCallback(
        async ({ userAccesses, userGroupAccesses, publicAccess }: SharedUpdate, id: string) => {
            const hasUsers = Array.isArray(userAccesses);
            const hasUserGroups = Array.isArray(userGroupAccesses);
            const hasPublicAccess = publicAccess !== undefined;

            if (!hasUsers && !hasUserGroups && !hasPublicAccess) {
                console.warn("No user, user group, or public access provided.");
                return Promise.resolve();
            }

            const mappedUsers = hasUsers ? userAccesses.map(({ id, name }) => ({ id, name })) : undefined;
            const mappedUserGroups = hasUserGroups
                ? userGroupAccesses.map(({ id, name }) => ({ id, name }))
                : undefined;

            const landingToUpdate = settings.landingPagePermissions.find(landing => landing.id === id);
            if (!landingToUpdate) {
                throw new Error(`Landing page with id ${id} not found in settings.`);
            }

            const updatedPermissions: LandingPagePermission = {
                ...landingToUpdate,
                users: mappedUsers ?? landingToUpdate.users,
                userGroups: mappedUserGroups ?? landingToUpdate.userGroups,
                publicAccess: hasPublicAccess ? publicAccess : landingToUpdate.publicAccess,
            };

            const updatedSettings = settings.updateLandingPagePermissions(
                settings.landingPagePermissions,
                updatedPermissions
            );

            saveSettingsFn(updatedSettings);
        },
        [saveSettingsFn, settings]
    );

    const updateSettingsPermissions = useCallback(
        async ({ userAccesses, userGroupAccesses }: SharedUpdate) => {
            const hasUsers = Array.isArray(userAccesses);
            const hasUserGroups = Array.isArray(userGroupAccesses);

            if (!hasUsers && !hasUserGroups) {
                console.warn("No user or user group accesses provided.");
                return Promise.resolve();
            }

            const mappedUsers = hasUsers ? userAccesses.map(({ id, name }) => ({ id, name })) : undefined;

            const mappedUserGroups = hasUserGroups
                ? userGroupAccesses.map(({ id, name }) => ({ id, name }))
                : undefined;

            const updatedPermissions: Permission = {
                users: mappedUsers ?? settings.permissions.users,
                userGroups: mappedUserGroups ?? settings.permissions.userGroups,
            };

            const updatedSettings = new Settings({ ...settings, permissions: updatedPermissions });

            return saveSettingsFn(updatedSettings);
        },
        [settings, saveSettingsFn]
    );

    const updateShowAllActions = useCallback(
        async (value: boolean) => {
            const settingsToUpdate = settings.updateShowAllActions(value);
            saveSettingsFn(settingsToUpdate);
        },
        [saveSettingsFn, settings]
    );

    const trackViews = useCallback(
        (event: AnalyticsEvent) => {
            const googleAnalytics = settings.analytics.googleAnalyticsCode
                ? new GoogleAnalytics(settings.analytics.googleAnalyticsCode)
                : undefined;
            const matomoAnalytics = settings.analytics.matomoUrl
                ? new MatomoAnalytics(settings.analytics.matomoUrl)
                : undefined;

            const analyticsTrackers = _([googleAnalytics, matomoAnalytics]).compact().value();
            sendAnalyticsEvents({ analyticsTrackers, event });
        },
        [settings.analytics.googleAnalyticsCode, settings.analytics.matomoUrl]
    );

    const permissionDialogProps: PermissionHandlerProps = useAccessPermissionsDialog({
        permissions: settings.permissions,
        updatePermissions: updateSettingsPermissions,
        name: i18n.t("Access to settings"),
    });

    return {
        settings,
        updateShowAllActions,
        updateDefaultApplication,
        updateLandingPagePermissions,
        userLandings,
        updateAnalyticsConfig,
        trackViews,
        settingPermissionsDialogProps: permissionDialogProps,
        setSettings: updateSettings,
    };
}

export function useSaveSettings(props: { onSuccess: (settings: Settings) => void; onError: (error: string) => void }) {
    const { compositionRoot, currentUser } = useAppContext();
    const { onSuccess, onError } = props;
    const updateSettingsFn = useCallback(
        (settings: Settings) => {
            return new Promise<void>((resolve, reject) => {
                return compositionRoot.settings.save
                    .execute({ settings: settings, user: currentUser })
                    .toPromise()
                    .then(() => {
                        onSuccess(settings);
                        return resolve();
                    })
                    .catch(error => {
                        onError(String(error));
                        return reject();
                    });
            });
        },
        [currentUser, compositionRoot.settings.save, onSuccess, onError]
    );

    return updateSettingsFn;
}
