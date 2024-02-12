import { AnalyticsEvent } from "../../domain/entities/AnalyticsEvent";
import { AnalyticsRepository } from "../../domain/repositories/AnalyticsRepository";

const GA_MEASUREMENT_ID = process.env["REACT_APP_GOOGLE_ANALYTICS_4"];

export class GoogleAnalyticsRepository implements AnalyticsRepository {
    private analytics?: Analytics;

    send(event: AnalyticsEvent) {
        if (!this.analytics) this.analytics = new Analytics(event);
        this.analytics.sendAnalytics(event);
    }
}

class Analytics {
    constructor(event: AnalyticsEvent) {
        if (!window.gtag) throw new Error("gtag() function has not been declared.");
        window.gtag("js", new Date());
        this.setAnalyticsConfig(event);
    }

    sendAnalytics(event: AnalyticsEvent) {
        console.debug("Send analytics event: ", event.name, buildAnalyticsEvent(event));
        window.gtag("event", event.name, buildAnalyticsEvent(event));
    }

    setAnalyticsConfig(event: AnalyticsEvent) {
        /** When using HashRouter, set send_page_view to false to avoid sending dynamic page
         * events. When HashRouter is not used, set to true to avoid duplicated events.
         * */
        window.gtag("config", GA_MEASUREMENT_ID, { ...buildAnalyticsEvent(event), send_page_view: false });
    }
}

function buildAnalyticsEvent(event: AnalyticsEvent) {
    return {
        page_location: event.pageLocation,
        page_title: event.pageTitle,
    };
}
