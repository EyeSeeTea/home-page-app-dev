import { useCallback } from "react";
import styled from "styled-components";
import i18n from "../../../locales";
import { MarkdownViewer } from "../../components/markdown-viewer/MarkdownViewer";
import { LandingLayout, LandingContent } from "../../components/landing-layout";
import { useNavigate } from "react-router-dom";

export const AboutPage = () => {
    const navigate = useNavigate();

    const contents = [
        `# ${i18n.t("About Home Page App")}`,
        `#### ${i18n.t("Distributed under GNU GLPv3")}`,
        i18n.t("Home page App is a DHIS2 application that aims to provide direct links to DHIS2 applications. This app re-uses Training App technology to provide fully customizable landing pages for DHIS2 instances that can work on a per-user/group basis."),
        i18n.t(
            "This application has been funded by the WHO Integrated Data Platform initiative, composed by multiple departments at WHO and by Samaritan’s Purse to support countries in strengthening the collection and use of health data by using DHIS2. The application has developed by [EyeSeeTea SL](http://eyeseetea.com). The source code and release notes can be found at the [EyeSeeTea GitHub repository](https://github.com/EyeSeeTea/home-page-app). If you wish to contribute to the development of Home Page App with new features, please contact [EyeSeeTea](mailto:hello@eyeseetea.com).",
            { nsSeparator: false }
        ),
        i18n.t(
            "*Disclaimer: The WHO has developed this application to support countries build capacity for health data collection and use. WHO provides a series of tutorials to support countries to use the WHO DHIS2 standard packages which can be found in the [WHO Tutorial GitHub repository](https://github.com/WorldHealthOrganization/DHIS2-tutorials) and can be installed in the application. WHO provides no assurance as to the validity, accuracy or completeness of any other tutorials built by the application's user community.*",
            { nsSeparator: false }
        ),
        i18n.t(
            "Source code, roadmap, documentation and release notes can be found at the [EyeSeeTea GitHub Project Page](https://eyeseetea.github.io/home-page-app/)",
            { nsSeparator: false }
        ),
    ].join("\n\n");

    const goHome = useCallback(() => {
        navigate("/");
    }, [navigate]);

    return (
        <StyledLanding onGoHome={goHome} centerChildren={true}>
            <LandingContent maxWidth="lg">
                <MarkdownViewer source={contents} center={true} />
                <LogoWrapper>
                    <Logo alt={i18n.t("World Health Organization")} src="img/logo-who.svg" />
                    <Logo alt={i18n.t("Samaritan’s Purse")} src="img/logo-samaritans.svg" />
                    <Logo alt={i18n.t("EyeSeeTea")} src="img/logo-eyeseetea.png" />
                    <Logo alt={i18n.t("Lushomo")} src="img/logo-lushomo.png" />
                </LogoWrapper>
            </LandingContent>
        </StyledLanding>
    );
};

const StyledLanding = styled(LandingLayout)`
    ${LandingContent} {
        background-color: #276696;
        padding: 0px;
        margin: 0px 10px 20px 10px;
    }

    ${MarkdownViewer} {
        margin-right: 28px;
        text-align-last: unset;
    }
`;

const LogoWrapper = styled.div`
    align-items: center;
`;

const Logo = styled.img`
    width: 200px;
    margin: 0 50px;
`;
