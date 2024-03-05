import {
    ConfirmationDialog,
    ConfirmationDialogProps,
    ObjectsTable,
    TableAction,
    TableColumn,
    TableGlobalAction,
    useLoading,
    useSnackbar,
} from "@eyeseetea/d2-ui-components";
import { Checkbox, Icon } from "@material-ui/core";
import _ from "lodash";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { FileRejection } from "react-dropzone";
import styled from "styled-components";
import {
    LandingNode,
    LandingNodeType,
    OrderedLandingNode,
    buildOrderedLandingNodes,
} from "../../../domain/entities/LandingNode";
import i18n from "../../../locales";
import { MarkdownViewer } from "../../components/markdown-viewer/MarkdownViewer";
import { useAppContext } from "../../contexts/app-context";
import { Dropzone, DropzoneRef } from "../dropzone/Dropzone";
import { ImportTranslationDialog, ImportTranslationRef } from "../import-translation-dialog/ImportTranslationDialog";
import { LandingPageEditDialog, LandingPageEditDialogProps } from "../landing-page-edit-dialog/LandingPageEditDialog";
import { LandingBody } from "../landing-layout";
import { useConfig } from "../../pages/settings/useConfig";
import { LandingPagePermissionsDialog } from "../landing-page-permissions-dialog/LandingPagePermissionsDialog";

export const LandingPageListTable: React.FC<{ nodes: LandingNode[]; isLoading?: boolean }> = ({ nodes, isLoading }) => {
    const { compositionRoot, reload } = useAppContext();
    const { landingPagePermissions, updateLandingPagePermissions } = useConfig();

    const loading = useLoading();
    const snackbar = useSnackbar();

    const landingImportRef = useRef<DropzoneRef>(null);
    const translationImportRef = useRef<ImportTranslationRef>(null);

    const [dialogProps, updateDialog] = useState<ConfirmationDialogProps | null>(null);
    const [editDialogProps, updateEditDialog] = useState<LandingPageEditDialogProps | null>(null);
    const [landingPageId, setLandingPageId] = useState<string>("");

    type SettingsState = { type: "closed" } | { type: "open"; id: string };
    const [settingsState, setSettingsState] = useState<SettingsState>({ type: "closed" });

    const closeSettings = React.useCallback(() => {
        setSettingsState({ type: "closed" });
    }, []);

    const openImportDialog = useCallback(async () => {
        landingImportRef.current?.openDialog();
    }, [landingImportRef]);

    const handleFileUpload = useCallback(
        async (files: File[], rejections: FileRejection[]) => {
            if (files.length === 0 && rejections.length > 0) {
                snackbar.error(i18n.t("Couldn't read the file because it's not valid"));
            } else {
                loading.show(true, i18n.t("Importing landing pages(s)"));
                try {
                    updateDialog({
                        title: i18n.t("Importing a new landing page"),
                        description: i18n.t("This action might overwrite an existing landing page. Are you sure?"),
                        onSave: async () => {
                            loading.show(true, i18n.t("Importing landing page"));
                            const landings = await compositionRoot.landings.import(files);

                            loading.reset();
                            snackbar.success(
                                i18n.t("Imported {{n}} landing pages", {
                                    n: landings.filter(landing => landing.type === "root").length,
                                })
                            );
                            updateDialog(null);

                            await reload();
                        },
                        onCancel: () => {
                            updateDialog(null);
                        },
                        saveText: i18n.t("Yes"),
                        cancelText: i18n.t("No"),
                    });
                } catch (err: any) {
                    snackbar.error((err && err.message) || err.toString());
                } finally {
                    loading.reset();
                }
            }
        },
        [snackbar, loading, compositionRoot.landings, reload]
    );

    const handleTranslationUpload = useCallback(
        async (_key: string | undefined, lang: string, terms: Record<string, string>) => {
            const total = await compositionRoot.landings.importTranslations(lang, terms, landingPageId);
            if (total > 0) {
                snackbar.success(i18n.t("Imported {{total}} translation terms", { total }));
            } else {
                snackbar.warning(i18n.t("Unable to import translation terms"));
            }
        },
        [compositionRoot, landingPageId, snackbar]
    );

    const move = useCallback(
        async (ids: string[], nodes: LandingNode[], change: "up" | "down") => {
            const orderChange = change === "up" ? -1 : 1;
            const allNodes = flattenRows(nodes);

            const firstNode = allNodes.find(({ id }) => id === ids[0]);
            if (firstNode?.order === undefined) return;

            const parent = allNodes.find(({ id }) => id === firstNode?.parent);
            const secondNode = parent?.children[firstNode?.order + orderChange];
            if (secondNode?.order === undefined) return;

            await compositionRoot.landings.swapOrder(firstNode, secondNode);
            await reload();
        },
        [reload, compositionRoot]
    );

    const columns: TableColumn<LandingNode>[] = useMemo(
        () => [
            {
                name: "type",
                text: "Type",
                sortable: false,
                getValue: item => getTypeName(item.type),
            },
            {
                name: "name",
                text: "Name",
                getValue: item => item.name?.referenceValue ?? "-",
            },
            {
                name: "title",
                text: "Title",
                getValue: item => item.title?.referenceValue ?? "-",
            },
            {
                name: "content",
                text: "Content",
                getValue: item => (item.content ? <StepPreview value={item.content.referenceValue} /> : "-"),
            },
            {
                name: "icon",
                text: "Icon",
                getValue: item =>
                    item.icon ? <ItemIcon src={item.icon} alt={`Icon for ${item.name.referenceValue}`} /> : "-",
            },
            {
                name: "executeOnInit",
                text: "Execute on init",
                getValue: item =>
                    item.parent === "none" ? <Checkbox checked={item.executeOnInit} color="primary" disabled /> : "",
            },
        ],
        []
    );

    const actions: TableAction<LandingNode>[] = useMemo(
        () => [
            {
                name: "add-section",
                text: i18n.t("Add section"),
                icon: <Icon>add</Icon>,
                onClick: ids => {
                    const parent = flattenRows(nodes).find(({ id }) => id === ids[0]);
                    if (!parent) return;

                    updateEditDialog({
                        title: i18n.t("Add section"),
                        type: "section",
                        parent: parent.id,
                        order: parent.children.length,
                        onCancel: () => updateEditDialog(null),
                        onSave: async node => {
                            updateEditDialog(null);
                            await compositionRoot.landings.update(node);
                            await reload();
                        },
                    });
                },
                isActive: nodes => _.every(nodes, item => item.type === "root"),
            },
            {
                name: "add-sub-section",
                text: i18n.t("Add sub-section"),
                icon: <Icon>add</Icon>,
                onClick: ids => {
                    const parent = flattenRows(nodes).find(({ id }) => id === ids[0]);
                    if (!parent) return;

                    updateEditDialog({
                        title: i18n.t("Add sub-section"),
                        type: "sub-section",
                        parent: parent.id,
                        order: parent.children.length,
                        onCancel: () => updateEditDialog(null),
                        onSave: async node => {
                            updateEditDialog(null);
                            await compositionRoot.landings.update(node);
                            await reload();
                        },
                    });
                },
                isActive: nodes => _.every(nodes, item => item.type === "section"),
            },
            {
                name: "add-category",
                text: i18n.t("Add category"),
                icon: <Icon>add</Icon>,
                onClick: ids => {
                    const parent = flattenRows(nodes).find(({ id }) => id === ids[0]);
                    if (!parent) return;

                    updateEditDialog({
                        title: i18n.t("Add category"),
                        type: "category",
                        parent: parent.id,
                        order: parent.children.length,
                        onCancel: () => updateEditDialog(null),
                        onSave: async node => {
                            updateEditDialog(null);
                            await compositionRoot.landings.update(node);
                            await reload();
                        },
                    });
                },
                isActive: nodes => _.every(nodes, item => item.type === "sub-section" || item.type === "category"),
            },
            {
                name: "edit",
                text: i18n.t("Edit"),
                icon: <Icon>edit</Icon>,
                onClick: ids => {
                    const node = flattenRows(nodes).find(({ id }) => id === ids[0]);
                    if (!node) return;

                    updateEditDialog({
                        title: i18n.t("Edit"),
                        type: node.type,
                        parent: node.parent,
                        initialNode: node,
                        order: node.order ?? 0,
                        onCancel: () => updateEditDialog(null),
                        onSave: async node => {
                            updateEditDialog(null);
                            await compositionRoot.landings.update(node);
                            await reload();
                        },
                    });
                },
            },
            {
                name: "sharing",
                text: i18n.t("Sharing settings"),
                icon: <Icon>share</Icon>,
                onClick: ids => setSettingsState({ type: "open", id: ids[0] ?? "" }),
            },
            {
                name: "remove",
                text: i18n.t("Delete"),
                icon: <Icon>delete</Icon>,
                multiple: true,
                onClick: async ids => {
                    await compositionRoot.landings.delete(ids);
                    await reload();
                },
                isActive: nodes => _.every(nodes, item => item.id !== "root"),
            },
            {
                name: "export-landing-page",
                text: i18n.t("Export landing page"),
                icon: <Icon>cloud_download</Icon>,
                onClick: async (ids: string[]) => {
                    if (!ids[0]) return;
                    loading.show(true, i18n.t("Exporting landing page(s)"));
                    await compositionRoot.landings.export(ids);
                    loading.reset();
                },
                isActive: nodes => _.every(nodes, item => item.type === "root"),
                multiple: true,
            },
            {
                name: "export-translations",
                text: i18n.t("Export JSON translations"),
                icon: <Icon>translate</Icon>,
                onClick: async ids => {
                    loading.show(true, i18n.t("Exporting translations"));
                    await compositionRoot.landings.exportTranslations(ids);
                    loading.reset();
                },
                isActive: nodes => _.every(nodes, item => item.type === "root"),
                multiple: false,
            },
            {
                name: "import-translations",
                text: i18n.t("Import JSON translations"),
                icon: <Icon>translate</Icon>,
                onClick: (ids: string[]) => {
                    const landingPageId = ids[0];
                    if (!landingPageId) return;

                    setLandingPageId(landingPageId);
                    translationImportRef.current?.startImport();
                },
                isActive: nodes => _.every(nodes, item => item.type === "root"),
                multiple: false,
            },
            {
                name: "move-up",
                text: i18n.t("Move up"),
                icon: <Icon>arrow_upwards</Icon>,
                onClick: ids => move(ids, nodes, "up"),
                isActive: nodes => _.every(nodes, ({ type, order }) => type !== "root" && order !== 0),
                multiple: false,
            },
            {
                name: "move-down",
                text: i18n.t("Move down"),
                icon: <Icon>arrow_downwards</Icon>,
                onClick: ids => move(ids, nodes, "down"),
                isActive: (nodes: OrderedLandingNode[]) =>
                    _.every(nodes, ({ type, order, lastOrder }) => type !== "root" && order !== lastOrder),
                multiple: false,
            },
        ],
        [compositionRoot, reload, loading, nodes, move]
    );

    const globalActions: TableGlobalAction[] | undefined = useMemo(
        () => [
            {
                name: "import",
                text: i18n.t("Import landing pages"),
                icon: <Icon>arrow_upward</Icon>,
                onClick: openImportDialog,
            },
        ],
        [openImportDialog]
    );

    return (
        <React.Fragment>
            {dialogProps && <ConfirmationDialog isOpen={true} maxWidth={"xl"} {...dialogProps} />}
            {editDialogProps && <LandingPageEditDialog isOpen={true} {...editDialogProps} />}

            {settingsState.type === "open" && (
                <LandingPagePermissionsDialog
                    landingPageId={settingsState.id}
                    allowPublicAccess
                    object={{
                        name: "Access to landing page",
                        publicAccess:
                            landingPagePermissions?.find(
                                landingPagePermission => landingPagePermission.id === settingsState.id
                            )?.publicAccess ?? "r-------",
                        userAccesses:
                            landingPagePermissions
                                ?.find(landingPagePermission => landingPagePermission.id === settingsState.id)
                                ?.users?.map(ref => ({
                                    ...ref,
                                    access: "r-------",
                                })) ?? [],
                        userGroupAccesses:
                            landingPagePermissions
                                ?.find(landingPagePermission => landingPagePermission.id === settingsState.id)
                                ?.userGroups?.map(ref => ({
                                    ...ref,
                                    access: "r-------",
                                })) ?? [],
                    }}
                    onChange={update => updateLandingPagePermissions(update, settingsState.id)}
                    onClose={closeSettings}
                />
            )}
            <ImportTranslationDialog type="landing-page" ref={translationImportRef} onSave={handleTranslationUpload} />

            <Dropzone
                ref={landingImportRef}
                accept={"application/zip,application/zip-compressed,application/x-zip-compressed"}
                onDrop={handleFileUpload}
            >
                <ObjectsTable<LandingNode>
                    rows={buildOrderedLandingNodes(nodes)}
                    columns={columns}
                    actions={actions}
                    globalActions={globalActions}
                    childrenKeys={["children"]}
                    loading={isLoading}
                />
            </Dropzone>
        </React.Fragment>
    );
};

const getTypeName = (type: LandingNodeType) => {
    switch (type) {
        case "root":
            return i18n.t("Landing page");
        case "section":
            return i18n.t("Section");
        case "sub-section":
            return i18n.t("Sub-section");
        case "category":
            return i18n.t("Category");
        default:
            return "-";
    }
};

const flattenRows = (rows: LandingNode[]): LandingNode[] => {
    return _.flatMap(rows, row => [row, ...flattenRows(row.children)]);
};

const ItemIcon = styled.img`
    width: 100px;
`;

const StepPreview: React.FC<{
    className?: string;
    value?: string;
}> = ({ className, value }) => {
    if (!value) return null;

    return (
        <StyleLandingBody className={className}>
            <MarkdownViewer source={value} />
        </StyleLandingBody>
    );
};

const StyleLandingBody = styled(LandingBody)`
    max-width: 600px;
    border-radius: 18px;
    box-shadow: 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12),
        0 5px 5px -3px rgba(0, 0, 0, 0.2);
    background-color: #276696;
`;
