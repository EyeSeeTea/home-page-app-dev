import {
    ConfirmationDialog,
    ConfirmationDialogProps,
    ObjectsTable,
    TableAction,
    TableColumn,
    TableGlobalAction,
    TableSelection,
    TableState,
    useLoading,
    useSnackbar,
} from "@eyeseetea/d2-ui-components";
import { Icon } from "@material-ui/core";
import GetAppIcon from "@material-ui/icons/GetApp";
import _ from "lodash";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { FileRejection } from "react-dropzone";
import styled from "styled-components";
import { Action } from "../../../domain/entities/Action";
import i18n from "../../../locales";
import { FlattenUnion } from "../../../utils/flatten-union";
import { zipMimeType } from "../../../utils/files";
import { useAppContext } from "../../contexts/app-context";
import { AlertIcon } from "../alert-icon/AlertIcon";
import { Dropzone, DropzoneRef } from "../dropzone/Dropzone";
import { ImportTranslationDialog, ImportTranslationRef } from "../import-translation-dialog/ImportTranslationDialog";
import { InputDialog, InputDialogProps } from "../input-dialog/InputDialog";
import { MarkdownEditorDialog, MarkdownEditorDialogProps } from "../markdown-editor/MarkdownEditorDialog";
import { MarkdownViewer } from "../markdown-viewer/MarkdownViewer";
import { ModalBody } from "../modal";

export interface ModuleListTableProps {
    rows: ListItem[];
    refreshRows?: () => Promise<void>;
    tableActions: ModuleListTableAction;
    onActionButtonClick?: (event: React.MouseEvent<unknown>) => void;
    isLoading?: boolean;
}

export const ModuleListTable: React.FC<ModuleListTableProps> = props => {
    const { rows, tableActions, onActionButtonClick, refreshRows = async () => {}, isLoading } = props;
    const { usecases } = useAppContext();

    const loading = useLoading();
    const snackbar = useSnackbar();

    const moduleImportRef = useRef<DropzoneRef>(null);
    const translationImportRef = useRef<ImportTranslationRef>(null);

    const [selection, setSelection] = useState<TableSelection[]>([]);

    const [dialogProps, updateDialog] = useState<ConfirmationDialogProps | null>(null);
    const [markdownDialogProps, updateMarkdownDialog] = useState<MarkdownEditorDialogProps | null>(null);
    const [inputDialogProps, updateInputDialog] = useState<InputDialogProps | null>(null);

    const handleFileUpload = useCallback(
        async (files: File[], rejections: FileRejection[]) => {
            if (files.length === 0 && rejections.length > 0) {
                snackbar.error(i18n.t("Couldn't read the file because it's not valid"));
            } else {
                loading.show(true, i18n.t("Importing module(s)"));
                try {
                    const modules = await usecases.actions.import(files);
                    snackbar.success(i18n.t("Imported {{n}} modules", { n: modules.length }));
                    await refreshRows();
                } catch (err: any) {
                    snackbar.error((err && err.message) || err.toString());
                } finally {
                    loading.reset();
                }
            }
        },
        [snackbar, refreshRows, usecases, loading]
    );

    const handleTranslationUpload = useCallback(
        async (key: string | undefined, lang: string, terms: Record<string, string>) => {
            if (!key) return;
            const total = await usecases.actions.importTranslations(key, lang, terms);
            if (total > 0) {
                snackbar.success(i18n.t("Imported {{total}} translation terms", { total }));
            } else {
                snackbar.warning(i18n.t("Unable to import translation terms"));
            }
        },
        [usecases, snackbar]
    );

    const deleteModules = useCallback(
        async (ids: string[]) => {
            updateDialog({
                title: i18n.t("Are you sure you want to delete the selected modules?"),
                description: i18n.t("This action cannot be reversed"),
                onCancel: () => {
                    updateDialog(null);
                },
                onSave: async () => {
                    updateDialog(null);
                    if (!tableActions.deleteActions) return;

                    loading.show(true, i18n.t("Deleting modules"));
                    await tableActions.deleteActions({ ids });
                    loading.reset();

                    snackbar.success("Successfully deleted modules");
                    setSelection([]);
                    await refreshRows();
                },
                cancelText: i18n.t("Cancel"),
                saveText: i18n.t("Delete modules"),
            });
        },
        [tableActions, loading, refreshRows, snackbar]
    );

    const addModule = useCallback(() => {
        if (!tableActions.openCreateActionPage) return;
        tableActions.openCreateActionPage();
    }, [tableActions]);

    const editModule = useCallback(
        (ids: string[]) => {
            if (!tableActions.openEditActionPage || !ids[0]) return;
            tableActions.openEditActionPage({ id: ids[0] });
        },
        [tableActions]
    );

    const cloneModule = useCallback(
        (ids: string[]) => {
            if (!tableActions.openCloneActionPage || !ids[0]) return;
            tableActions.openCloneActionPage({ id: ids[0] });
        },
        [tableActions]
    );

    const moveUp = useCallback(
        async (ids: string[]) => {
            const allRows = rows;
            const rowIndex = _.findIndex(allRows, ({ id }) => id === ids[0]);
            const row = allRows[rowIndex];
            if (!tableActions.swap || rowIndex === -1 || rowIndex === 0 || !row) return;

            const { id: prevRowId } = allRows[rowIndex - 1] ?? {};

            if (prevRowId && ids[0] && row.id) {
                await tableActions.swap({ id: row.id, type: row.rowType, from: ids[0], to: prevRowId });
            }

            await refreshRows();
        },
        [tableActions, rows, refreshRows]
    );

    const moveDown = useCallback(
        async (ids: string[]) => {
            const rowIndex = _.findIndex(rows, ({ id }) => id === ids[0]);
            const row = rows[rowIndex];
            if (!tableActions.swap || rowIndex === -1 || rowIndex === rows.length - 1 || !row) return;

            const { id: nextRowId } = rows[rowIndex + 1] ?? {};
            if (nextRowId && ids[0] && row.id) {
                await tableActions.swap({ id: row.id, type: row.rowType, from: ids[0], to: nextRowId });
            }

            await refreshRows();
        },
        [tableActions, rows, refreshRows]
    );

    const installApp = useCallback(
        async (ids: string[]) => {
            if (!tableActions.installApp || !ids[0]) return;

            loading.show(true, i18n.t("Installing application"));
            const installed = await tableActions.installApp({ id: ids[0] });
            loading.reset();

            if (!installed) {
                snackbar.error("Error installing app");
                return;
            }

            snackbar.success("Successfully installed app");
            await refreshRows();
        },
        [tableActions, snackbar, loading, refreshRows]
    );

    const exportModule = useCallback(
        async (ids: string[]) => {
            if (!ids[0]) return;
            loading.show(true, i18n.t("Exporting module(s)"));
            await usecases.actions.export(ids);
            loading.reset();
        },
        [loading, usecases]
    );

    const exportTranslations = useCallback(
        async (ids: string[]) => {
            if (!ids[0]) return;
            loading.show(true, i18n.t("Exporting translations"));
            await usecases.actions.exportTranslations(ids[0]);
            loading.reset();
        },
        [loading, usecases]
    );

    const onTableChange = useCallback(({ selection }: TableState<ListItem>) => {
        setSelection(selection);
    }, []);

    const openImportDialog = useCallback(async () => {
        moduleImportRef.current?.openDialog();
    }, [moduleImportRef]);

    const columns: TableColumn<ListItem>[] = useMemo(
        () => [
            {
                name: "name",
                text: "Name",
                sortable: false,
                getValue: item => (
                    <div>
                        {item.name}
                        {!item.installed && item.rowType === "module" ? (
                            <AlertIcon tooltip={i18n.t("App is not installed in this instance")} />
                        ) : null}
                        {!item.compatible && item.rowType === "module" ? (
                            <AlertIcon tooltip={i18n.t("Module does not support this DHIS2 version")} />
                        ) : null}
                    </div>
                ),
            },
            {
                name: "id",
                text: "Code",
                hidden: true,
                sortable: false,
            },
        ],
        []
    );

    const actions: TableAction<ListItem>[] = useMemo(
        () => [
            {
                name: "new-module",
                text: i18n.t("Add module"),
                icon: <Icon>add</Icon>,
                onClick: addModule,
                isActive: rows => {
                    return !!tableActions.openCreateActionPage && _.every(rows, item => item.rowType === "module");
                },
            },
            {
                name: "edit-module",
                text: i18n.t("Edit module"),
                icon: <Icon>edit</Icon>,
                onClick: editModule,
                isActive: rows => {
                    return (
                        !!tableActions.openEditActionPage &&
                        _.every(rows, item => item.rowType === "module" && item.editable)
                    );
                },
            },
            {
                name: "clone-module",
                text: i18n.t("Clone module"),
                icon: <Icon>content_copy</Icon>,
                onClick: cloneModule,
                isActive: rows => {
                    return (
                        !!tableActions.openCloneActionPage &&
                        _.every(rows, item => item.rowType === "module" && item.editable)
                    );
                },
            },
            {
                name: "delete-module",
                text: i18n.t("Delete module"),
                icon: <Icon>delete</Icon>,
                multiple: true,
                onClick: deleteModules,
                isActive: rows => {
                    return (
                        !!tableActions.deleteActions &&
                        _.every(rows, item => item.rowType === "module" && item.editable)
                    );
                },
            },
            {
                name: "move-up",
                text: i18n.t("Move up"),
                icon: <Icon>arrow_upwards</Icon>,
                onClick: moveUp,
                isActive: rows => {
                    return !!tableActions.swap && _.every(rows, ({ position, editable }) => position !== 0 && editable);
                },
            },
            {
                name: "move-down",
                text: i18n.t("Move down"),
                icon: <Icon>arrow_downwards</Icon>,
                onClick: moveDown,
                isActive: rows => {
                    return (
                        !!tableActions.swap &&
                        _.every(rows, ({ position, lastPosition, editable }) => position !== lastPosition && editable)
                    );
                },
            },
            {
                name: "install-app",
                text: i18n.t("Install app"),
                icon: <GetAppIcon />,
                onClick: installApp,
                isActive: rows => {
                    return (
                        !!tableActions.installApp && _.every(rows, item => item.rowType === "module" && !item.installed)
                    );
                },
            },
            {
                name: "export-module",
                text: i18n.t("Export module"),
                icon: <Icon>cloud_download</Icon>,
                onClick: exportModule,
                isActive: rows => {
                    return _.every(rows, item => item.rowType === "module");
                },
                multiple: true,
            },
            {
                name: "export-translations",
                text: i18n.t("Export JSON translations"),
                icon: <Icon>translate</Icon>,
                onClick: exportTranslations,
                isActive: rows => {
                    return _.every(rows, item => item.rowType === "module");
                },
                multiple: false,
            },
        ],
        [
            tableActions,
            editModule,
            cloneModule,
            deleteModules,
            moveUp,
            moveDown,
            installApp,
            addModule,
            exportModule,
            exportTranslations,
        ]
    );

    const globalActions: TableGlobalAction[] = useMemo(
        () => [
            {
                name: "import-modules",
                text: i18n.t("Import modules"),
                icon: <Icon>arrow_upward</Icon>,
                onClick: openImportDialog,
            },
            {
                name: "import-translations",
                text: i18n.t("Import JSON translations"),
                icon: <Icon>translate</Icon>,
                onClick: () => {
                    translationImportRef.current?.startImport();
                },
            },
        ],
        [openImportDialog, translationImportRef]
    );

    return (
        <PageWrapper>
            {dialogProps && <ConfirmationDialog isOpen={true} maxWidth={"xl"} {...dialogProps} />}

            <ImportTranslationDialog type="module" ref={translationImportRef} onSave={handleTranslationUpload} />

            <Dropzone ref={moduleImportRef} accept={zipMimeType} onDrop={handleFileUpload}>
                <ObjectsTable<ListItem>
                    rows={rows}
                    columns={columns}
                    actions={actions}
                    globalActions={globalActions}
                    selection={selection}
                    onChange={onTableChange}
                    childrenKeys={["steps", "welcome", "pages"]}
                    sorting={{ field: "position", order: "asc" }}
                    onActionButtonClick={onActionButtonClick}
                    loading={isLoading}
                />
            </Dropzone>
        </PageWrapper>
    );
};

export type ListItem = FlattenUnion<ListItemModule>;

export interface ListItemModule extends Omit<Action, "name"> {
    name: string;
    rowType: "module";
    position: number;
    lastPosition: number;
}

export const buildListActions = (modules: Action[]): ListItemModule[] => {
    return modules.map((model, moduleIdx) => ({
        ...model,
        name: model.name.referenceValue,
        rowType: "module",
        position: moduleIdx,
        lastPosition: modules.length - 1,
    }));
};

const StepPreview: React.FC<{
    className?: string;
    value?: string;
}> = ({ className, value }) => {
    if (!value) return null;

    return (
        <StyledModalBody className={className}>
            <MarkdownViewer source={value} />
        </StyledModalBody>
    );
};

const StyledModalBody = styled(ModalBody)`
    max-width: 600px;
`;

const PageWrapper = styled.div`
    .MuiTableRow-root {
        background: white;
    }
`;

export type ModuleListTableAction = {
    openEditActionPage?: (params: { id: string }) => void;
    openCloneActionPage?: (params: { id: string }) => void;
    openCreateActionPage?: () => void;
    deleteActions?: (params: { ids: string[] }) => Promise<void>;
    resetActions?: (params: { ids: string[] }) => Promise<void>;
    swap?: (params: { type: "module"; id: string; from: string; to: string }) => Promise<void>;
    uploadFile?: (params: { data: ArrayBuffer; name: string }) => Promise<string>;
    installApp?: (params: { id: string }) => Promise<boolean>;
};
