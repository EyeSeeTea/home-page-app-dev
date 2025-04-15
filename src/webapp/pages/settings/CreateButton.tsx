import React from "react";
import i18n from "../../../utils/i18n";
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from "@material-ui/lab";
import { useNavigate } from "react-router-dom";
import { Maybe } from "../../../types/utils";
import { LandingNode } from "../../../domain/entities/LandingNode";
import { useAppContext } from "../../contexts/app-context";
import {
    LandingPageEditDialog,
    LandingPageEditDialogProps,
} from "../../components/landing-page-edit-dialog/LandingPageEditDialog";
import { Description, Message, OpenInBrowser } from "@material-ui/icons";
import {
    NotificationDetailsDialog,
    NotificationDetailsDialogProps,
} from "../../components/user-notification/NotificationDetailsDialog";

export interface CreateButtonProps {
    landings: Maybe<LandingNode[]>;
}

export const CreateButton: React.FC<CreateButtonProps> = props => {
    const { editDialogProps, openAddAction, openAddLandingPage, newNotificationDialogProps, openNewNotification } =
        useActions(props.landings);
    const [isOpen, open] = useOpenAction();

    return (
        <>
            {editDialogProps && <LandingPageEditDialog isOpen={true} {...editDialogProps} />}
            {newNotificationDialogProps && <NotificationDetailsDialog {...newNotificationDialogProps} />}

            <SpeedDial
                open={isOpen}
                onClick={open}
                style={styles.speedDial}
                ariaLabel={i18n.t("Create")}
                icon={<SpeedDialIcon />}
            >
                <SpeedDialAction
                    onClick={openNewNotification}
                    tooltipOpen
                    icon={<Message />}
                    tooltipTitle={i18n.t("Notification")}
                />

                <SpeedDialAction
                    onClick={openAddAction}
                    tooltipOpen
                    icon={<OpenInBrowser />}
                    tooltipTitle={i18n.t("Action")}
                />

                <SpeedDialAction
                    onClick={openAddLandingPage}
                    tooltipOpen
                    icon={<Description />}
                    tooltipTitle={i18n.t("Landing Page")}
                />
            </SpeedDial>
        </>
    );
};

const styles = {
    speedDial: { position: "fixed" as const, bottom: 16, right: 16 },
};

function useOpenAction() {
    const [isOpen, setOpen] = React.useState(false);
    const open = React.useCallback(() => setOpen(prev => !prev), []);
    return [isOpen, open] as const;
}

function useActions(landings: Maybe<LandingNode[]>) {
    const { reload, compositionRoot } = useAppContext();
    const [editDialogProps, updateEditDialog] = React.useState<LandingPageEditDialogProps>();
    const [newNotificationDialogProps, setNewNotificationDialogProps] =
        React.useState<NotificationDetailsDialogProps>();
    const navigate = useNavigate();
    const openAddAction = React.useCallback(() => navigate("/actions/new"), [navigate]);
    const landingsCount = landings?.length || 0;

    const openAddLandingPage = React.useCallback(() => {
        updateEditDialog({
            title: i18n.t("Create new Landing Page"),
            type: "root",
            parent: "none",
            order: landingsCount,
            onCancel: () => updateEditDialog(undefined),
            onSave: async node => {
                updateEditDialog(undefined);
                await compositionRoot.landings.create(node);
                await reload();
            },
        });
    }, [updateEditDialog, landingsCount, compositionRoot, reload]);

    const openNewNotification = React.useCallback(() => {
        setNewNotificationDialogProps({
            onClose: () => setNewNotificationDialogProps(undefined),
            onSave: notification =>
                compositionRoot.notifications
                    .save([notification])
                    .toPromise()
                    .then(() => reload()),
        });
    }, [compositionRoot, reload]);

    return { editDialogProps, openAddAction, openAddLandingPage, newNotificationDialogProps, openNewNotification };
}
