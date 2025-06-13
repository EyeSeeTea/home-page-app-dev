import React, { useCallback, useRef, useState } from "react";
import { useSnackbar } from "@eyeseetea/d2-ui-components";
import _ from "lodash";
import i18n from "../../../utils/i18n";

import { ImportTranslationDialog, ImportTranslationDialogProps } from "./ImportTranslationDialog";
import { Translations } from "../../../domain/entities/TranslatableText";

type UseImportTranslationDialogProps = Pick<ImportTranslationDialogProps, "type" | "onSave">;

export function useImportTranslationDialog({ type, onSave }: UseImportTranslationDialogProps) {
    const snackbar = useSnackbar();
    const [terms, setTerms] = useState<Translations>();
    const [open, setOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const startImport = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const onClose = useCallback(() => {
        setOpen(false);
        setTerms(undefined);
    }, []);

    const onFileUpload = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            try {
                const file = event.target.files?.[0];
                if (!file) throw new Error("No file received on upload");

                const text = await file.text();
                const json = JSON.parse(text);
                const parsedTerms = _.pickBy(json, _.isString) as Translations;

                setTerms(parsedTerms);
                setOpen(true);
            } catch (e) {
                console.error(e);
                snackbar.error(i18n.t("File is not a valid translation JSON dictionary"));
            } finally {
                // Reset input value to allow re-uploading the same file
                if (event.target) event.target.value = "";
            }
        },
        [snackbar]
    );

    const importDialog = (
        <>
            <input
                type="file"
                accept="application/json"
                onChange={onFileUpload}
                ref={fileInputRef}
                style={{ display: "none" }}
            />
            {open && terms && (
                <ImportTranslationDialog type={type} onSave={onSave} terms={terms} open={open} onClose={onClose} />
            )}
        </>
    );

    return {
        startImport,
        ImportTranslationDialog: importDialog,
    };
}
