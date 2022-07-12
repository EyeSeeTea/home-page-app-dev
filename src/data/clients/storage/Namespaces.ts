export const dataStoreNamespace = "training-app";
export const constantPrefix = "Training App Storage";

export type Namespace = typeof Namespaces[keyof typeof Namespaces];

export const Namespaces = {
    ACTIONS: "actions",
    LANDING_PAGES: "landing-pages",
    CONFIG: "config",
};

export const NamespaceProperties: Record<Namespace, string[]> = {
    [Namespaces.ACTIONS]: [],
    [Namespaces.LANDING_PAGES]: [],
    [Namespaces.CONFIG]: [],
};
