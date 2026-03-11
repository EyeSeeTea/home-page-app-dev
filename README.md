# home-page-app-dev

Home Page app is a DHIS2 app that allows to create dynamic landing pages in DHIS2

This project uses **Yarn 4** managed by **Corepack** and declares:

```json
"packageManager": "yarn@4.12.0"
```

If your machine still defaults to Yarn 1 globally, enable Corepack once:

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
```

Then inside this repo:

```bash
yarn install
```

### Google analytics

In order to send home page views to Google Analytics, the GA4 code must be provided in the settings page under `Google Analytics 4` option.
