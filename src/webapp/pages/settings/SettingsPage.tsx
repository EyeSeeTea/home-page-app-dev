import { ConfirmationDialog, ConfirmationDialogProps, useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";
import { FormGroup, Icon, ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Permission } from "../../../domain/entities/Permission";
import { NamedRef } from "../../../domain/entities/Ref";
import i18n from "../../../locales";
import { ComponentParameter } from "../../../types/utils";
import { LandingPageListTable } from "../../components/landing-page-list-table/LandingPageListTable";
import { buildListActions, ModuleListTable } from "../../components/action-list-table/ActionListTable";
import { PageHeader } from "../../components/page-header/PageHeader";
import { PermissionsDialog, SharedUpdate } from "../../components/permissions-dialog/PermissionsDialog";
import { useAppContext } from "../../contexts/app-context";
import { DhisPage } from "../dhis/DhisPage";

export const SettingsPage: React.FC = () => {
    const { actions, landings, reload, usecases, setAppState, showAllActions, isLoading, isAdmin } = useAppContext();

    const snackbar = useSnackbar();
    const loading = useLoading();

    const [permissionsType, setPermissionsType] = useState<string | null>(null);
    const [settingsPermissions, setSettingsPermissions] = useState<Permission>();
    const [danglingDocuments, setDanglingDocuments] = useState<NamedRef[]>([]);
    const [dialogProps, updateDialog] = useState<ConfirmationDialogProps | null>(null);

    const openTraining = useCallback(() => {
        setAppState({ type: "HOME" });
    }, [setAppState]);

    const updateSettingsPermissions = useCallback(
        async ({ userAccesses, userGroupAccesses }: SharedUpdate) => {
            await usecases.config.updateSettingsPermissions({
                users: userAccesses?.map(({ id, name }) => ({ id, name })),
                userGroups: userGroupAccesses?.map(({ id, name }) => ({ id, name })),
            });

            const newSettings = await usecases.config.getSettingsPermissions();
            setSettingsPermissions(newSettings);
        },
        [usecases]
    );

    const buildSharingDescription = useCallback(() => {
        const users = settingsPermissions?.users?.length ?? 0;
        const userGroups = settingsPermissions?.userGroups?.length ?? 0;

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
    }, [settingsPermissions]);

    const cleanUpDanglingDocuments = useCallback(async () => {
        updateDialog({
            title: i18n.t("Clean-up unused documents"),
            description: (
                <ul>
                    {danglingDocuments.map(item => (
                        <li key={item.id}>{`${item.id} ${item.name}`}</li>
                    ))}
                </ul>
            ),
            onCancel: () => updateDialog(null),
            onSave: async () => {
                loading.show(true, i18n.t("Deleting dangling documents"));

                await usecases.instance.deleteDocuments(danglingDocuments.map(({ id }) => id));
                const newDanglingList = await usecases.instance.listDanglingDocuments();
                setDanglingDocuments(newDanglingList);

                snackbar.success(i18n.t("Deleted dangling documents"));
                loading.reset();
                updateDialog(null);
            },
            saveText: i18n.t("Proceed"),
        });
    }, [danglingDocuments, loading, snackbar, usecases]);

    const refreshActions = useCallback(async () => {
        usecases.instance.listDanglingDocuments().then(setDanglingDocuments);
        await reload();
    }, [reload, usecases]);

    const openAddModule = useCallback(() => {
        setAppState({ type: "CREATE_MODULE" });
    }, [setAppState]);

    const toggleShowAllActions = useCallback(async () => {
        await usecases.config.setShowAllActions(!showAllActions);
        await reload();
    }, [showAllActions, reload, usecases]);

    const tableActions: ComponentParameter<typeof ModuleListTable, "tableActions"> = useMemo(
        () => ({
            openEditActionPage: ({ id }) => {
                setAppState({ type: "EDIT_MODULE", module: id });
            },
            openCloneActionPage: ({ id }) => {
                setAppState({ type: "CLONE_MODULE", module: id });
            },
            deleteActions: ({ ids }) => usecases.actions.delete(ids),
            swap: ({ from, to }) => usecases.actions.swapOrder(from, to),
            uploadFile: ({ data, name }) => usecases.instance.uploadFile(data, name),
            installApp: ({ id }) => usecases.instance.installApp(id),
        }),
        [usecases, setAppState, snackbar]
    );

    useEffect(() => {
        usecases.config.getSettingsPermissions().then(setSettingsPermissions);
        usecases.instance.listDanglingDocuments().then(setDanglingDocuments);
    }, [usecases]);

    useEffect(() => {
        reload();
    }, [reload]);

    return (
        <DhisPage>
            {dialogProps && <ConfirmationDialog isOpen={true} maxWidth={"lg"} fullWidth={true} {...dialogProps} />}

            {!!permissionsType && (
                <PermissionsDialog
                    object={{
                        name: "Access to settings",
                        publicAccess: "--------",
                        userAccesses:
                            settingsPermissions?.users?.map(ref => ({
                                ...ref,
                                access: "rw----",
                            })) ?? [],
                        userGroupAccesses:
                            settingsPermissions?.userGroups?.map(ref => ({
                                ...ref,
                                access: "rw----",
                            })) ?? [],
                    }}
                    onChange={updateSettingsPermissions}
                    onClose={() => setPermissionsType(null)}
                />
            )}

            <Header title={i18n.t("Settings")} onBackClick={openTraining} />

            <Container>
                <Title>{i18n.t("Permissions")}</Title>

                <Group row={true}>
                    <ListItem button onClick={() => setPermissionsType("settings")}>
                        <ListItemIcon>
                            <Icon>settings</Icon>
                        </ListItemIcon>
                        <ListItemText primary={i18n.t("Access to Settings")} secondary={buildSharingDescription()} />
                    </ListItem>

                    <ListItem button onClick={toggleShowAllActions}>
                        <ListItemIcon>
                            <Icon>{showAllActions ? "visibility" : "visibility_off"}</Icon>
                        </ListItemIcon>
                        <ListItemText
                            primary={i18n.t("Show list with Actions on main landing page")}
                            secondary={
                                showAllActions
                                    ? i18n.t("A list with all the existing Actions is visible")
                                    : i18n.t("The list with all the existing  Actions is hidden")
                            }
                        />
                    </ListItem>

                    {isAdmin && (
                        <ListItem button disabled={danglingDocuments.length === 0} onClick={cleanUpDanglingDocuments}>
                            <ListItemIcon>
                                <Icon>delete_forever</Icon>
                            </ListItemIcon>
                            <ListItemText
                                primary={i18n.t("Clean-up unused documents")}
                                secondary={
                                    danglingDocuments.length === 0
                                        ? i18n.t("There are no unused documents to clean")
                                        : i18n.t("There are {{total}} documents available to clean", {
                                              total: danglingDocuments.length,
                                          })
                                }
                            />
                        </ListItem>
                    )}
                </Group>

                <Title>{i18n.t("Landing page")}</Title>

                <LandingPageListTable nodes={landings} isLoading={isLoading} />

                <Title>{i18n.t("Training Actions")}</Title>

                <ModuleListTable
                    rows={buildListActions(actions)}
                    refreshRows={refreshActions}
                    tableActions={tableActions}
                    onActionButtonClick={openAddModule}
                    isLoading={isLoading}
                />
            </Container>
        </DhisPage>
    );
};

const Title = styled.h3`
    margin-top: 25px;
`;

const Group = styled(FormGroup)`
    margin-bottom: 35px;
    margin-left: 0;
`;

const Container = styled.div`
    margin: 1.5rem;
`;

const Header = styled(PageHeader)`
    margin-top: 1rem;
`;
