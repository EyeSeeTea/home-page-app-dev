import React from "react";
import { useHistory } from "react-router-dom";
import i18n from "../../../locales";
import { PageHeader } from "../../components/page-header/PageHeader";

export const SettingsPage: React.FC = () => {
    const history = useHistory();

    const backHome = () => history.push("/dashboard");

    return (
        <React.Fragment>
            <PageHeader title={i18n.t("Settings")} onBackClick={backHome} />
        </React.Fragment>
    );
};
