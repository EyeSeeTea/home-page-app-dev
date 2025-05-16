import { ConfirmationDialog } from "@eyeseetea/d2-ui-components";
import { Notification } from "../../../domain/entities/Notification";
import i18n from "../../../locales";
import { NotificationContent } from "./NotificationContent";

export const UserNotificationDialog: React.FC<UserNotificationDialogProps> = (props) => {
    const { notifications, onClose } = props;
    const content = notifications.map(({ content }) => content).join("\n\n");

    return (
        <ConfirmationDialog
            title={i18n.t("Notifications")}
            open={true}
            onCancel={onClose}
            cancelText={i18n.t("Close")}
            maxWidth={"md"}
            fullWidth={true}
        >
            <NotificationContent content={content} />
        </ConfirmationDialog>
    );
};

export interface UserNotificationDialogProps {
    notifications: Notification[];
    onClose: () => Promise<void>;
}
