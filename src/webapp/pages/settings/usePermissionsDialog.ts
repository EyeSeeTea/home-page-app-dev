import { useState, useCallback } from "react";
import { PermissionsDialogProps, SharedUpdate } from "../../components/permissions-dialog/PermissionsDialog";
import { Permission } from "../../../domain/entities/Permission";
import i18n from "../../../utils/i18n";

type UsePermissionsDialogOptions = {
    title: string;
    onUpdate: (update: SharedUpdate) => Promise<void>;
    permissions?: Permission;
};

export type PermissionDialogData = {
    openDialog: () => void;
    dialogProps: buildSharingDescription;
};

export function usePermissionsDialog({ title, onUpdate, permissions }: UsePermissionsDialogOptions) {
    const [isOpen, setIsOpen] = useState(false);

    const openDialog = useCallback(() => setIsOpen(true), []);
    const closeDialog = useCallback(() => setIsOpen(false), []);

    const buildSharingDescription = useCallback(() => {
        const users = permissions?.users?.length ?? 0;
        const userGroups = permissions?.userGroups?.length ?? 0;

        if (users > 0 && userGroups > 0) {
            return i18n.t("Accessible to {{users}} users and {{userGroups}} user groups", {
                users,
                userGroups,
            });
        } else if (users > 0) {
            return i18n.t("Accessible to {{users}} users", { users });
        } else if (userGroups > 0) {
            return i18n.t("Accessible to {{userGroups}} user groups", { userGroups });
        } else {
            return i18n.t("Only accessible to system administrators");
        }
    }, [permissions]);

    const dialogProps: PermissionsDialogProps = isOpen
        ? {
              object: {
                  name: title,
                  publicAccess: "--------",
                  userAccesses:
                      permissions?.users?.map(ref => ({
                          ...ref,
                          access: "rw----",
                      })) ?? [],
                  userGroupAccesses:
                      permissions?.userGroups?.map(ref => ({
                          ...ref,
                          access: "rw----",
                      })) ?? [],
              },
              onChange: onUpdate,
              onClose: closeDialog,
          }
        : null;

    return {
        openDialog,
        dialogProps,
        buildSharingDescription,
    };
}
