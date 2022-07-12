import { Icon, IconButton, Tooltip } from "@material-ui/core";
import React from "react";
import { useHistory } from "react-router-dom";
import i18n from "../../../locales";
import { Card, CardGrid } from "../../components/card-grid/CardGrid";

export const LandingPage: React.FC = React.memo(() => {
    const history = useHistory();

    const goToSettings = () => {
        history.push("/settings");
    };

    const cards: Card[] = [
        {
            title: "Section",
            key: "main",
            children: [
                {
                    name: "John",
                    description: "Entry point 1",
                    listAction: () => history.push("/for/John"),
                },
                {
                    name: "Mary",
                    description: "Entry point 2",
                    listAction: () => history.push("/for/Mary"),
                },
            ],
        },
    ];

    return (
        <React.Fragment>
            <Tooltip title={i18n.t("Settings")} placement="left">
                <IconButton onClick={goToSettings}>
                    <Icon>settings</Icon>
                </IconButton>
            </Tooltip>
            <CardGrid cards={cards} />
        </React.Fragment>
    );
});
