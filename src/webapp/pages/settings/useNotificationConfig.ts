import { useCallback, useState } from "react";
import { useAppContext } from "../../contexts/app-context";
import { NotificationConfig } from "../../../domain/entities/NotificationConfig";
import { SharedUpdate } from "../../components/permissions-dialog/PermissionsDialog";
import { usePermissionsDialog } from "./usePermissionsDialog";
import i18n from "../../../utils/i18n";

export function useNotificationConfig() {
    const { compositionRoot } = useAppContext();
    const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>();

    const updateNotificationPermissions = useCallback(
        async ({ userAccesses, userGroupAccesses }: SharedUpdate) => {
            await compositionRoot.notifications
                .saveConfig({
                    permissions: {
                        ...(userAccesses && { users: userAccesses.map(({ id, name }) => ({ id, name })) }),
                        ...(userGroupAccesses && {
                            userGroups: userGroupAccesses.map(({ id, name }) => ({ id, name })),
                        }),
                    },
                })
                .toPromise();

            const newConfig = await compositionRoot.notifications.getConfig().toPromise();
            setNotificationConfig(newConfig);
        },
        [compositionRoot]
    );

    const notificationPermissionsDialog = usePermissionsDialog({
        title: i18n.t("Access to Notifications"),
        onUpdate: updateNotificationPermissions,
        permissions: notificationConfig?.permissions,
    });

    return {
        notificationConfig,
        notificationPermissionsDialog,
    };
}
