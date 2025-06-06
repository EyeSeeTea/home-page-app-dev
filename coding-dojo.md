# Improvements

## Clean architecture

-   Implementation details in entity: [`Config.ts`](https://github.com/EyeSeeTea/home-page-app-dev/blob/development/src/data/entities/Config.ts)

```ts
export interface Config {
    // DHIS api object
    api: D2Api;
    currentUser: User;
    instance: Instance;
    storageClient: StorageClient;
}
```

config is being used in the [ActionDefaultRepository](https://github.com/EyeSeeTea/home-page-app-dev/blob/development/src/data/repositories/ActionDefaultRepository.ts) constructor then using the reference to D2Api to make requests.

Solution: remove `d2-api` from `Config` and add it to the constructor in `ActionDefaultRepository`

-   [Config Repository](https://github.com/EyeSeeTea/home-page-app-dev/blob/development/src/domain/repositories/ConfigRepository.ts) expose methods to different entities:

```ts
export interface ConfigRepository {
    get(): Promise<Config>;
    getUser(): Promise<User>;
    getInstance(): Instance;
    getDefaultApplication(): Promise<string>;
    updateDefaultApplication(defaultApplication: string): Promise<void>;
    getGoogleAnalyticsCode(): Promise<Maybe<string>>;
    updateGoogleAnalyticsCode(code: string): Promise<void>;
    getSettingsPermissions(): Promise<Permission>;
    updateSettingsPermissions(update: Partial<Permission>): Promise<void>;
    getLandingPagePermissions(): Promise<LandingPagePermission[]>;
    updateLandingPagePermissions(update: Partial<LandingPagePermission>, id: string): Promise<void>;
    getShowAllActions(): Promise<boolean>;
    setShowAllActions(flag: boolean): Promise<void>;
}
```

Solution: Create a new entity and repository for `Settings`:

```ts
// entity
export type Settings = {
    landingPermissions: LandingPagePermission[];
    permissions: Permission[];
    analytics: {
        googleCode: string;
        matomoUrl: string;
    };
    showAllActions: boolean;
};

// repository

export interface SettingsRepository {
    get(): Promise<Settings>;
    save(settings: Settings): Promise<Settings>;
}

// GetSettingsUseCase
export class GetSettingsUseCase {
    execute(): FutureData<Settings> {
        return this.settingsRepository.get();
    }
}

// SaveSettingsUseCase
export class SaveSettingsUseCase {
    execute(settings: Settings): FutureData<Settings> {
        // logic here
        return this.settingsRepository.save(settings);
    }
}
```

this will give us some benefits in the [presentation layer as well](https://github.com/EyeSeeTea/home-page-app-dev/blob/development/src/webapp/pages/settings/useConfig.ts)

```ts
// we can get rid of all these states

useEffect(() => {
    compositionRoot.config.getShowAllActions().then(setShowAllActions);
    compositionRoot.config.getDefaultApplication().then(setDefaultApplication);
    compositionRoot.config.getSettingsPermissions().then(setSettingsPermissions);
    compositionRoot.config.getLandingPagePermissions().then(setLandingPagePermissions);
    compositionRoot.config.getAnalyticsConfig().then(setAnalyticsConfig);
    compositionRoot.config.getUser().then(setUser);
}, [compositionRoot]);

// and have something like this:
const [settings, setSettings] = React.useState<Settings>();

useEffect(() => {
    compositionRoot.settings.get().then(setSettings);
}, [compositionRoot]);

// then replace the settings variable all over the repository
```
