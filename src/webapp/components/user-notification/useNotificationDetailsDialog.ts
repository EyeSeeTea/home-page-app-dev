import { useAppContext } from "../../contexts/app-context";
import { useCallback, useState } from "react";
import { NotificationWildcard } from "../../../domain/entities/Notification";
import { ShareUpdate } from "@eyeseetea/d2-ui-components";
import { NotificationDetailsDialogProps } from "./NotificationDetailsDialog";
import { generateUid } from "../../../data/utils/uid";
import { NamedRef } from "../../../domain/entities/Ref";
import { SharingRule } from "@eyeseetea/d2-ui-components/sharing/types";
import { NotificationViewModel } from "../../models/Notification";

export const useNotificationDetailsDialog = (props: NotificationDetailsDialogProps) => {
    const { onSave, initialNotification } = props;
    const { compositionRoot } = useAppContext();
    const [notification, setNotification] = useState(initialNotification || newNotification());

    const handleSave = useCallback(async () => {
        await onSave(notification);
    }, [notification, onSave]);

    const onContentChange = useCallback((content: string) => {
        setNotification(notification => ({ ...notification, content }));
    }, []);

    const onSharingChanged = useCallback(async (updatedAttributes: ShareUpdate) => {
        setNotification(notification => {
            const { users, userGroups, wildcard } = notification.recipients;
            const { userAccesses, userGroupAccesses } = updatedAttributes;
            return {
                ...notification,
                recipients: {
                    users: userAccesses ? mapSharingRulesToRecipient(userAccesses) : users,
                    userGroups: userGroupAccesses ? mapSharingRulesToRecipient(userGroupAccesses) : userGroups,
                    wildcard: wildcard,
                },
            };
        });
    }, []);

    const onWildcardChange = useCallback(value => {
        setNotification(notification => ({
            ...notification,
            recipients: {
                ...notification.recipients,
                wildcard: value,
            },
        }));
    }, []);

    const searchSharing = useCallback(
        (query: string) => compositionRoot.instance.searchUsers(query),
        [compositionRoot]
    );

    return {
        handleSave,
        notification,
        onContentChange,
        onSharingChanged,
        onWildcardChange,
        searchSharing,
        sharingMeta: generateSharingMeta(notification),
    };
};

function newNotification(): NotificationViewModel {
    return {
        id: generateUid(),
        content: "",
        recipients: { users: [], userGroups: [], wildcard: NotificationWildcard.ALL },
        readBy: [],
        createdAt: new Date(),
        permissions: { userAccesses: [], userGroupAccesses: [], publicAccess: "rw------" },
        canEdit: true,
    };
}

const mapRecipientToSharingRules = (recipients: NamedRef[]): SharingRule[] => {
    return recipients.map(({ id, name }) => ({ id, displayName: name, access: "--------" }));
};
const mapSharingRulesToRecipient = (sharingRules: SharingRule[]): NamedRef[] => {
    return sharingRules.map(({ id, displayName }) => ({ id, name: displayName }));
};

const generateSharingMeta = (notification: NotificationViewModel) => ({
    meta: { allowPublicAccess: false, allowExternalAccess: false },
    object: {
        id: "",
        displayName: "",
        userAccesses: mapRecipientToSharingRules(notification.recipients.users),
        userGroupAccesses: mapRecipientToSharingRules(notification.recipients.userGroups),
    },
});
