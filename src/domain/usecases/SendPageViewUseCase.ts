import { Maybe } from "../../types/utils";
import { AnalyticsEvent } from "../entities/AnalyticsEvent";
import { AnalyticsRepository } from "../repositories/AnalyticsRepository";

export class SendPageViewUseCase {
    constructor(private analyticsRepository: AnalyticsRepository) {}

    execute(options: Maybe<{ location: Maybe<string>; title: Maybe<string> }>) {
        const defaultOptions: AnalyticsEvent = {
            name: "page_view",
            pageLocation: options?.location ?? window.location.hash.split("?")[0] ?? "",
            pageTitle: options?.title ?? document.title,
        };

        this.analyticsRepository.send(defaultOptions);
    }
}
