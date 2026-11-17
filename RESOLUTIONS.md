# Yarn Resolutions

This file documents every entry in the `resolutions` block of `package.json`. Each entry should
answer three questions: **what is being constrained**, **why it exists**, and **when it can be
removed**.

`package.json` does not allow comments, so this file is the only place that knowledge lives.
**If you add or remove a resolution, update this file in the same commit.**

It also records dependency decisions the manifest cannot express at all: findings accepted because
no fix exists, and constraints that were tested and retired.

## Conventions

- **`^` range or exact version? Ask what the number is asserting.**

    A **floor** — "never below this" — takes a `^` range. Almost every security constraint is a
    floor: it does not matter whether `axios` resolves to 1.19.0 or 1.20.0, only that it is not
    1.13.5. Newer is strictly better, so let it land.

    A **fixture** — "exactly this" — takes an exact version. These are compatibility constraints,
    not security ones: something else binds to that specific release.

    An exact version where a floor belonged **decays**. `axios: 1.13.5` was written to fix a
    vulnerability and, because no patch could ever be selected, ended up holding the whole tree *at*
    a version carrying 29 open advisories — it had become the finding it was added to prevent. In
    practice: is there a higher version that would also work? Use `^`. Does something bind to this
    exact release? Pin it, **and write the condition for unpinning it.** If you cannot state that
    condition, it should probably have been a `^` range.

- Prefer **per-parent** paths (`parent/child`) over standalone descriptors when only one consumer
  needs constraining. A standalone descriptor rewrites the request of every consumer in the tree,
  including ones that were already healthy.

- **Versioned-parent paths go stale silently.** `parent@npm:<exact>/child` stops matching the moment
  the parent patch-bumps, and yarn does not warn. There is no entry of that shape in this file; if
  you add one, mark it as a decay risk and re-check it at every audit.

- **The version in a versioned-parent path is the _descriptor_, not the resolved version.**
  `glob@npm:7.2.3/minimatch` reads correctly next to a lockfile entry saying `version: 7.2.3`, and
  matches nothing, because the descriptors consumers actually request are `^7.1.1` and friends. Take
  the key off the descriptor line, never off the `version:` line below it.

- **A versioned-parent path cannot select a version outside the range the parent declares; a
  parent-name path can.** `vite@4.5.14` declares `esbuild: ^0.18.10`, so `vite@npm:^4.0.0/esbuild:
  ^0.25.0` silently does nothing while the sibling `vite@npm:^4.0.0/rollup: ^3.30.0` binds, because
  3.30.0 is inside the `^3.27.1` vite declares. To lift a child past what its parent declares you
  need the parent-name form — and then check what else shares that parent name, because it applies
  to all of them. This tree carried a `vite/esbuild` entry for exactly that reason until the vite
  upgrade made it unnecessary.

- **Prefer re-resolution to a new constraint.** Most transitive findings are a stale lockfile rather
  than a missing fix: the declared range already admits the patched release and `yarn up -R
  <package>` reaches it with no manifest change at all.

- **Removing a constraint is not the same as upgrading it away.** For a package no direct dependency
  requests, deleting the entry hands version selection back to the parents, and a parent may be the
  reason the old version was there. `axios`, `lodash` and `qs` all resolve _downwards_ if their
  entries are removed.

- **Test a constraint by removing it, re-installing, and comparing the _resolved versions_** — not
  the lockfile bytes. A constraint can rewrite a descriptor, change the lockfile, and leave every
  installed version exactly where it was. That is what `ansi-regex` turned out to be doing; see
  [Removed](#removed).

- **When a returning version looks alarming, check the advisory's range before keeping the pin.** An
  older version coming back is not by itself a reason to keep a constraint — `glob-parent@3.1.0`
  returns when its entry is removed, and the advisory affects `>= 4.0.0, < 5.1.2`.

- **Validate the control before trusting a zero from the advisories API.** A query returns nothing
  both for a clean version and for one that was never published. See the warning under
  [Removed](#removed).

- **A constraint that clears the scanner but breaks a consumer is not a fix.** Verify against the
  tool that actually uses the package, not just `yarn install`.

- **A published fix can be unusable by the consumer.** `decode-uri-component` 0.5.1 closes two advisories and
  installs cleanly, but it is ESM-only (`type: module`, `default` export) and `source-map-resolve@0.6.0`, its only
  consumer, is CommonJS: `require()` returns a namespace object and the first call throws `TypeError:
  decodeUriComponentLib is not a function`. `yarn install` and `yarn npm audit` both pass. Only running the
  consumer's operation shows it. See [Tried and reverted](#tried-and-reverted).

- **A dependency can bring its own copy of the build tool.** `vitest@4` declares `vite: ^6 || ^7 || ^8` as a real
  dependency, so with the app on `^7.3.6` the lockfile resolved a second `vite@8.3.7` (plus `rolldown` and
  `lightningcss` and their native binaries). Check `yarn why vite -R` after any test-runner bump and align the
  copies with a scoped resolution (see `vitest/vite` below).

- **A major bump can remove a CLI option the scripts use.** vitest 4 dropped `--reporter=basic`; the `test` script
  failed at startup with `Failed to load custom Reporter from basic` until it used `--reporter=default`. Re-run
  `yarn test` after any runner bump and compare the file and test counts (7 files, 63 tests on 2026-11-17).

## Audit cadence

Re-audit the dependency tree monthly and before every release. A constraint that has silently
stopped working shows up as a finding that keeps coming back for a package that already has one.
Each entry below has a **drop when** condition — when it becomes true, delete the entry and
re-install.

Note that different scanners disagree on severity, so measure against the one the CI gate reads
before concluding the tree is clean, and do not mix sources when comparing.

Last full audit: **2026-11-17** (78 Dependency-Track alerts open on `development` before this round).

---

## Active resolutions

### Security floors

#### `axios: ^1.20.0`

- **Why:** `axios` is a direct dependency and also arrives transitively through the DHIS2 API client
  and a dev-time wait helper, so a single floor is the simplest control over every path. It was
  previously the exact version `1.13.5`, which no patch could ever move, and then `^1.18.0`, which left 1.19.0
  resolved with 12 more advisories fixed only in 1.20.0 (all `>= x, < 1.20.0`). The direct dependency is pinned to the
  resolved 1.21.1.
- **Fixes:** 29 advisories — GHSA-hfxv-24rg-xrqf, GHSA-p92q-9vqr-4j8v, GHSA-j5f8-grm9-p9fc,
  GHSA-35jp-ww65-95wh, GHSA-777c-7fjr-54vf, GHSA-pjwm-pj3p-43mv, GHSA-3g43-6gmg-66jw,
  GHSA-q8qp-cvcw-x6jj, GHSA-62hf-57xw-28j9, GHSA-pf86-5x62-jrwf, GHSA-6chq-wfr3-2hj9,
  GHSA-pmwg-cvhr-8vh7 (high); GHSA-mwf2-3pr3-8698, GHSA-jqh4-m9w3-8hp9, GHSA-7q8q-rj6j-mhjq,
  GHSA-mmx7-hfxf-jppx, GHSA-42h9-826w-cgv3, GHSA-pmv8-rq9r-6j72, GHSA-898c-q2cr-xwhg,
  GHSA-3w6x-2g7m-8v23, GHSA-445q-vr5w-6q77, GHSA-m7pr-hjqh-92cm, GHSA-5c9x-8gcm-mpgx,
  GHSA-vf2m-468p-8v99, GHSA-xx6v-rp6x-q39c, GHSA-w9j2-pvgh-6h63, GHSA-fvcv-3m26-pcqx,
  GHSA-3p68-rc4w-qgx5 (medium); GHSA-xhjh-pmcv-23jw (low). Runtime-reachable — credential leakage to
  redirect targets and proxy-header forwarding.
- **Also fixes (2026-11 round):** GHSA-3pq3-5fj3-cg6v, GHSA-542g-h47m-68v8, GHSA-r4gj-5m52-g5wh, GHSA-m8m8-qj5v-23w3,
  GHSA-mghh-pgcx-3jjj, GHSA-x97p-jq2g-jp4f, GHSA-c29m-xwm3-cm6r (high); GHSA-4hqw-qxg8-jxx2, GHSA-44g4-m2mj-wpvx,
  GHSA-9fr6-4gfg-395g, GHSA-j8rh-479h-cp32, GHSA-vh66-26gq-q6x8 (medium). First patched release for every one: 1.20.0.
- **Drop when:** no consumer requests `axios < 1.20`. Verify with `yarn why axios`.

#### `lodash: ^4.18.0`

- **Why:** ⚠️ **Load-bearing.** `lodash` is a direct dependency and is also requested by several
  DHIS2 and Babel packages, some of which pin it exactly — removing the floor puts `4.17.21` back
  in the tree alongside 4.18.1. It was previously the exact version `4.17.23`. A single major line
  is present, so a global floor is safe.
- **Fixes:** GHSA-r5fr-rjxr-66jc (high) — code injection via `_.template`; GHSA-f23m-r3pf-42rh
  (medium) — prototype pollution in `_.unset`/`_.omit`.
- **Drop when:** no consumer requests `lodash` below 4.18.0. Verify by removing it and re-installing;
  today `4.17.21` reappears.

#### `node-fetch: ^2.6.7`

- **Why:** ⚠️ **Load-bearing.** Removing it puts `node-fetch@1.7.3` back in the tree through a
  consumer that requests `^1.0.1`; the 1.x range cannot reach the fix, so this floor is what lifts
  that consumer onto a patched line. Verified by removing it and re-installing: 1.7.3 reappears.
  Written as a floor rather than the exact `2.7.0` it used to be, so later patches land unaided.
  The floor is `^2.6.7` because that is where the fix for the 1.x line lands; it resolves to 2.7.0
  today.
- **Fixes:** historic secure-header forwarding across cross-host redirects on the 1.x line.
- **Drop when:** the `^1.0.1` consumer is gone. Verify by removing it, re-installing and confirming
  no 1.x appears.

#### `qs: ^6.16.1`

- **Why:** ⚠️ **Load-bearing.** Transitive, through the DHIS2 API client and the browser `url`
  polyfill. The API client requests an exact `6.9.7`, so removing the floor resolves `qs`
  *downwards* rather than upwards — verified by removing it and re-installing. Previously the exact
  version `6.15.0`, then `^6.15.3`, which still admitted 6.15.3 (three advisories fixed in 6.16.0 and 6.16.1).
- **Fixes:** GHSA-q8mj-m7cp-5q26 (medium) — unhandled `TypeError` in `qs.stringify` with
  `arrayFormat: 'comma'` and `encodeValuesOnly: true` over an array containing `null`; GHSA-6pq8-jhm2-2vcw (medium, first
  patched 6.16.1); GHSA-4mjr-xmp4-gh2g (medium) and GHSA-x5fp-wj9c-mxmx (low), first patched 6.16.0.
- **Drop when:** every consumer requests `qs >= 6.16.1` natively. The API client is the blocker.

#### `moment: ^2.31.0`

- **Why:** transitive. It was an inherited `^2.29.4` floor with no recorded reason, and it let 2.30.1 through while
  GHSA-4p3w-j4w9-5jqw (path traversal in `moment.locale`, affects `>= 2.29.2, < 2.31.0`) was published. A floor starts at the
  highest first-patched version, which is 2.31.0.
- **Fixes:** GHSA-4p3w-j4w9-5jqw (medium).
- **Drop when:** no consumer requests `moment < 2.31`. Verify with `yarn why moment -R`.

### Scoped resolutions

These constrain one parent's request rather than every consumer in the tree.

#### `i18next-conv/node-gettext: ^3.0.1`

- **Why:** `i18next-conv@6.1.1` requests `node-gettext@^2.0.0`, which resolves to the vulnerable
  2.1.0. ⚠️ **The advisory looks unfixable and is not.** It records no patched version, so tooling
  reports it as a dead end — but its affected range is `<= 3.0.0`, and **3.0.1 is published and
  outside that range.** Always compare the affected range against the published version list before
  concluding a finding cannot be fixed. Scoped to the parent; build-time only, used during i18n
  generation.
- **Fixes:** GHSA-g974-hxvm-x689 (medium) — prototype pollution.
- **Drop when:** `i18next-conv` requests `node-gettext@^3.0.1` or later natively, or drops it.
  Verify with `yarn why node-gettext`.

#### `react-linkify/linkify-it: ^5.0.2`

- **Why:** `react-linkify@1.0.0-alpha` requests `linkify-it@^2.0.3`, and the 2.x line has no fix.
  react-linkify is unmaintained and written against the linkify-it 2 API, so this was **checked
  rather than assumed**: linkify-it 5 still exports a callable constructor, and `.tlds()` and
  `.match()` behave the same — matching a URL and an email in one pass returns the expected
  `https://…` and `mailto:…` results. Scoped to react-linkify so no other consumer is affected.
- **Fixes:** GHSA-v245-v573-v5vm, GHSA-22p9-wv53-3rq4 (high) — quadratic-complexity DoS.
- **Drop when:** the component library that depends on `react-linkify` drops or replaces it.

#### `vitest/vite: ^7.3.6`

- **Why:** `vitest@4.1.12` has `vite: ^6.0.0 || ^7.0.0 || ^8.0.0` as a dependency. Without this entry the lockfile holds two
  copies: the app's `vite@7.3.8` and a second `vite@8.3.7` for vitest, with `rolldown`, `lightningcss` and 26
  platform binaries. Pinning vitest's copy to the application's range leaves a single vite and a single esbuild, and runs the
  tests under the same vite that builds the app. Tests pass either way (7 files, 63 tests); the entry is about tree size and
  parity, not a failure. 7.x is inside the range vitest declares.
- **Fixes:** nothing directly. It avoids a second vite line to track (vite 8.3.7 has no live advisory today).
- **Drop when:** the application itself moves to `vite >= 8`, or vitest narrows its range to the line the app uses. Verify with
  `yarn why vite -R`: one copy.

### Compatibility fixtures — not security constraints

#### `i18next: 19.8.5`

- **Why:** held at the version the DHIS2 i18n wrapper expects. ⚠️ **Do not change this blind.**
  Moving off this line has been observed elsewhere to break application startup, because the wrapper
  binds to an older i18next API. Removing the entry puts both 10.6.0 and 26.3.6 in the tree at once.
- **Fixes:** nothing — compatibility only.
- **Drop when:** the i18n wrapper declares a compatible range and the application still starts.
  ⚠️ This line is end-of-life, so holding here indefinitely is itself a risk; revisit at the next
  wrapper bump.

### Inherited constraints — rationale not recovered

Added in `chore(security): pin remaining low-risk transitive fixes` and a companion commit, with no
recorded reasoning. **Each was tested** by removing it, re-installing and comparing resolved
versions. All of them still constrain something, so they were kept rather than removed
speculatively — as the `lodash` entry above shows, removing a resolution can resolve a package
*downwards*.

**They were converted from exact versions to `^` ranges in this change.** Several were security
floors written in fixture shape — the form that cannot receive a patch and eventually becomes the
finding it was added to prevent, which is exactly what happened to `axios` here. None was inside a
live advisory range at the time, so this is **not a remediation**: it closes a decay path before it
opens. Converting is also strictly narrower than removing, which has to be judged one entry at a
time.

A `^` range keeps every consumer on the major the exact version already forced it onto; it only
allows newer releases within that line.

| Entry | Now resolves to | Removing it entirely would bring back | Note |
| ----- | --------------- | ------------------------------------- | ---- |
| `@babel/runtime: ^7.26.10` | 7.29.7 | — | was exact; no recorded reason |
| `@babel/runtime-corejs3: ^7.26.10` | 7.29.7 | — | was exact; no recorded reason |
| `debug: ^4.4.3` | 4.4.3 | 2.6.9 and 3.2.7 | ⚠️ the floor value matters here: **GHSA-4x49-vf9v-38px reports `debug@4.4.2` as carrying malware after an npm account takeover**. A looser `^4.3.x` floor would admit it |
| `diff: ^5.2.2` | 5.2.2 | 4.0.4 | already the newest 5.x |
| `json5: ^2.2.3` | 2.2.3 | 1.0.2 | already the newest 2.x |
| `minimist: ^1.2.6` | 1.2.8 | — | was exact, two patches behind |
| `moment` | — | — | moved to [security floors](#moment-2310) on 2026-11-17: 2.30.1 became a live finding |
| `semver: ^7.7.4` | 7.8.5 | 6.3.1 | was exact; `^7` stays inside the 7 line |
| `uglify-js: ^3.17.4` | 3.19.3 | — | was exact, two minors behind |

Every version in the middle column was checked and none is inside a live advisory range.

**Drop when:** for each, confirm no consumer needs the constrained line, then remove it and
re-install, comparing **resolved versions** rather than lockfile bytes. Treat each individually —
they were added as one batch but have nothing else in common.

---

## Removed

Every entry here was removed after being tested the way the conventions above describe: take it out,
re-install, and compare the **resolved versions**. In each case the lockfile changed and the
installed versions did not, or changed only to something equally patched.

#### Inert — the declared ranges already reach the fix

| Entry | Resolves to, with **or without** the constraint |
| ----- | ----------------------------------------------- |
| `ansi-regex: 5.0.1` | 5.0.1 |
| `ua-parser-js: ^0.7.36` | 0.7.41 |
| `follow-redirects: ^1.16.0` | 1.16.0 |
| `form-data: ^4.0.6` | 4.0.6 |
| `handlebars: ^4.7.9` | 4.7.9 |
| `lodash-es: ^4.18.0` | 4.18.1 |

#### `glob-parent: 5.1.2` — removed after checking the advisory range

This one looked load-bearing and is not. Removing it puts `glob-parent@3.1.0` back in the tree
through `glob-stream@6.1.0`, which declares `^3.1.0` — so a test that only asks *"does an older
version come back?"* would keep the entry.

The advisory decides it. **GHSA-ww39-953v-wcq6 affects `>= 4.0.0, < 5.1.2`**, and 3.1.0 is below
that floor, so the version that returns was never in range. The other five consumers declare
`~5.1.2`, `^5.1.2` and `^5.1.0`, and all reach 5.1.2 on their own. The entry was pulling
`glob-stream` off the major it declares for no security benefit.

`is-glob@3.1.0` and `path-dirname@1.0.2` come back with it, as dependencies of glob-parent 3.x.
Neither package has an advisory at any version.

Verified with `yarn lint` — ESLint is the consumer the entry mattered most to — plus the unit
suite, `yarn localize` and a full build.

⚠️ **Choose the control for this kind of check carefully.** `glob-parent@5.0.0` was tried first as
a known-vulnerable control and returned nothing, which looked like the query was broken. That
version was simply never published. `glob-parent@5.1.1` returns the advisory correctly.

Each was previously an exact version that *was* holding the tree at a vulnerable release. Once the
lockfile was re-resolved, every parent's declared range turned out to reach the patched version on
its own, so the constraint had nothing left to do. `form-data` is the clearest case: its consumers
declare `^4.0.0`, which admits the patched 4.0.6 without help.

**Restore any of these only if** a parent appears whose declared range cannot reach the patched line.

#### `minimatch: ^3.1.4` and `brace-expansion: ^1.1.18` — removed together

| Package | With the constraints | Without |
| ------- | -------------------- | ------- |
| `minimatch` | 3.1.5 | 10.2.6 **and** 3.1.5 |
| `brace-expansion` | 1.1.18 | 1.1.18 **and** 5.0.9 |

All four releases are outside every advisory affecting them, so the security outcome is identical.
Two things made the constraints unnecessary:

- **The 3.x line reaches its patch unaided.** The ESLint 7 consumers declare `^3.0.4`, which already
  admits 3.1.5. The constraint was not what lifted them.
- **`brace-expansion` was only on the 1.x line because `minimatch` was held at 3.x.** Its sole
  requester was `minimatch@3.x` at a range that admits 1.1.18.

What the unscoped `minimatch` entry *did* do, which was never recorded: `glob@13.0.6` declares
`minimatch@^10.2.2`, and the global constraint pulled that consumer down **seven majors** to 3.1.5.
Removing it gives `glob@13` the line it declares while `glob@7` keeps 3.1.5 through its own
`^3.0.4`.

⚠️ **Before re-investigating this:** forcing `glob@13` onto `minimatch@3.1.5` looks like it should
break, because `glob@13` references `minimatch.escape` and `minimatch.unescape` and neither exists
in 3.1.5. It does not break — `glob@13` ships a bundle with `minimatch` inlined and never requires
the external copy at runtime. The constraint was neither helping nor breaking anything.

---

## Tried and reverted

#### `source-map-resolve/decode-uri-component: ^0.5.1` — a fix the consumer cannot load

`decode-uri-component@0.2.2` (GHSA-qr28-fpjm-wq7f high, GHSA-vcc3-ghjq-m6fr medium) was reached only through
`@testing-library/jest-dom@5.16.4` → `css@3.0.0` → `source-map-resolve@0.6.0`, which requests `^0.2.0`. The advisories are fixed
in 0.5.0 and 0.5.1, so a scoped resolution looked like the obvious closure. It bound correctly (`yarn why` showed 0.5.1) and the
audit cleared, but 0.5.1 is ESM-only: `require("decode-uri-component")` returns `{ __esModule, default }`, and
`source-map-resolve` calls it as a function. Exercising `resolveSourceMapSync` with a percent-encoded `sourceMappingURL` threw
`TypeError: decodeUriComponentLib is not a function` on Node 22. Every release at or above the fix (0.4.1, 0.5.0, 0.5.1) is
`type: module`, so no patched version works for this consumer. **The entry was removed.**

What closed it: `@testing-library/jest-dom` `5.16.4` → `5.17.0`, which depends on `@adobe/css-tools` instead of `css`. The
whole chain (`css`, `source-map-resolve`, `atob`, `decode-uri-component`) is gone from the lockfile, with no resolution and no
change to any test. This is option 2 of the ladder (upgrade the direct dependency) beating option 8 (resolution).

**Do not re-add a `decode-uri-component` entry** unless a consumer that can load an ES module appears.

## Remaining findings

Grouped by what would close them. Counts come from the GitHub advisories API on 2026-11-17 and are stated for the installed
version; the first group is closed. Dependency-Track reported 78 open alerts on `development` on 2026-11-04; this round leaves
the groups below.

### Resolved by the vite and vitest upgrades

The August round moved `vite ^4.2.0 → ^7.3.6`, `vitest ^0.34.0 → ^3.2.7`, `@vitejs/plugin-react ^3.1.0 → ^5.1.0` and
`vite-plugin-checker ^0.6.2 → ^0.11.0` and closed eight advisories (`vite@4.5.14`: GHSA-fx2h-pf6j-xcff, GHSA-c27g-q93r-2cwf,
GHSA-93m4-6634-74q7, GHSA-4w7w-66w2-5vf9, GHSA-v6wh-96g9-6wx3, GHSA-g4jq-h2w9-997c, GHSA-jqfw-vq24-v9c3; `vitest@0.34.6`:
GHSA-5xrq-8626-4rwp, critical). It needed no change to `vite.config.ts` and no test change.
**Stopping at `vite-plugin-checker` 0.11 is deliberate.** That line reaches vite 7 while still declaring `eslint: ">=7"` as an
optional peer, so the ESLint 7 toolchain is untouched.

**November round.** New advisories appeared on those versions: `vite@7.3.6` (GHSA-587h-7wmj-h5pm, GHSA-698v-4r3x-3vcv,
GHSA-9jrq-w75r-8gcw, GHSA-r825-w8mm-5pxw, GHSA-rq7h-c2jc-7f22, all first patched in 7.3.7) closed by re-resolving to 7.3.8, and,
on vitest 3.2.7, GHSA-82fw-gwwq-j7x9 and GHSA-qxg6-89mg-rqv8 (`@vitest/mocker`, fixed in 4.1.11 / 4.1.12) plus **two critical
`tinypool@1.1.1` advisories** (GHSA-5gmw-xhrv-c9v3 and GHSA-85c8-ppgw-ccpr, fixed in 2.1.1 / 2.1.2, with no 1.x fix). All of
them are closed by `vitest ^3.2.7 → ^4.1.12`: vitest 4 no longer depends on `tinypool` at all, so the package left the tree.

Two things the move needed, both in `package.json` rather than in code: the `test` script lost `--reporter=basic` (removed in
vitest 4; now `--reporter=default`) and the `vitest/vite` resolution above. Verified with `yarn install --immutable`, lint, 7
files / 63 tests (unchanged), `yarn build` (its `prebuild` runs the tests) and the smoke test against a local DHIS2 2.42.5.1: dev server earlier in the
round (before the `react-router-dom` and vitest bumps) and, on the final tree, the compiled 1.16.1 zip installed in the instance
(actions, landing, section and sharing created from Settings; both cards launched the Dashboard and Maps apps).

⚠️ **One thing worth knowing before revisiting this.** GHSA-c27g-q93r-2cwf and GHSA-v6wh-96g9-6wx3 each name *two* packages:
`launch-editor <= 2.8.2` and `vite`. Constraining `launch-editor` looks like a way to close both without upgrading, and it is not
— `launch-editor` is not a lockfile node (vite inlines it), so a resolution against it installs cleanly and changes nothing.

### Closed by a React Router major — 2 advisories

- `react-router@6.30.6`: GHSA-wrjc-x8rr-h8h6 (affects `>= 6.0.0 < 7.18.0`) and GHSA-337j-9hxr-rhxg (affects `>= 6.4.0 < 7.18.0`),
  both medium. The fix exists only in 7.18.0.
- `react-router-dom@6.30.6` has **no** open advisory: GHSA-jjmj-jmhj-qwj2 (`>= 6.30.2 <= 6.30.5`) is fixed in 6.30.6, published
  after the previous round, which had recorded 6.30.4 as the last release on the line. `react-router-dom` is pinned to the exact
  6.30.6 and `react-router` follows it.

The 6.x line has taken every patch it is going to take for the other two. Moving to React Router 7 is a breaking change across the
routing layer (the app uses hash routes, `<Link>`, `useNavigate` and nested `Route`s) and belongs in its own change.

- **Advisories against these components:** `react-router@6.30.6` has **two** open, both listed above; eighteen others exist against
  the package and are already patched in 6.30.6. `react-router-dom@6.30.6` has none.

### Resolved by a Node engine bump — `glob@13.0.6`, `minimatch@10.2.6` (2 advisories, closed)

- `glob@13.0.6`: GHSA-3g3m-2fjr-6pw4 (affects `>= 9.0.0 <= 14.0.1`, fixed in 14.0.2). `minimatch@10.2.6`: GHSA-g3hv-75wg-m249
  (affects `>= 7.0.0 < 11.0.1`, fixed in 11.0.1). Both medium, build-time only.
- Path: `evp_bytestokey` (browser crypto polyfills) → `node-gyp@npm:latest` (locked at 12.2.0) → `make-fetch-happen@15.0.4` →
  `cacache@20.0.3` → `glob@^13.0.0` → `minimatch@^10.2.2`. Nothing in the repository runs `node-gyp` (`enableScripts: false`).
- **Fix:** `yarn up -R node-gyp` re-resolves the `latest` descriptor to `node-gyp@13.1.0`, which no longer depends on
  `make-fetch-happen` or `cacache`. One step removed 38 packages from the lockfile: `glob`, `minimatch@10.2.6`,
  `make-fetch-happen`, `cacache`, `http-cache-semantics` (a withdrawn finding), `brace-expansion@5.0.12`, `ip-address`, `socks`
  and the `minipass` family; it added only `undici@8.12.4` (no live advisory). Every added version was checked against the
  advisories API (control: `undici@6.0.0` returns 23).
- **Cost:** `node-gyp@13.1.0` declares `engines.node: ^22.22.2 || ^24.15.0 || >=26`, so `.nvmrc` moved from `v22.22.0` to
  `v22.22.2`. Nothing else in the repository pins a Node version (the shared CI workflow brings its own). Yarn does not enforce
  engines on transitive dependencies and `node-gyp` never runs here; the bump keeps the lockfile and the declared Node consistent.
- **Why it was not a resolution:** the `latest` descriptor was only stale, not constrained; re-resolution (ladder option 1)
  was enough once the engine requirement was accepted.
- **Re-check when:** `node-gyp@npm:latest` is still locked at 13.x. A later `yarn up -R` can change the engine requirement again.
- Verified with `yarn install --immutable`, lint, 7 files / 63 tests (unchanged), `yarn build` and the smoke test (see above).

### No fix published — 1 advisory

- `elliptic@6.6.1`: GHSA-848j-6mx2-7j84 (low in the local audit, medium in Dependency-Track). The advisory affects `<= 6.6.1`, and
  6.6.1 is the most recent release published, so there is no version to move to. Reached only through the browser crypto
  polyfills used by the bundler.
- **Advisories against this component:** **one** open — the entry above. Eight others exist against `elliptic` and are all patched
  at or below 6.6.1, including the critical GHSA-vjh7-7g9h-fjfh, which 6.6.1 is itself the fix for.

### Withdrawn advisories and scanner artefacts — dismissal, not remediation

Six advisories have been withdrawn upstream and describe no real vulnerability; the advisories API returns zero live advisories
for the installed versions. Dependency-Track can keep reporting them, so they need dismissing in the scanner rather than a code
change; upgrading to "fix" them would correct nothing. None has a patched version because there is nothing to patch.

| Advisory | Component | Withdrawn |
| -------- | --------- | --------- |
| GHSA-gv7w-rqvm-qjhr | `esbuild` | 2026-06-17 |
| GHSA-p5wg-g6qr-c7cg | `eslint@7.32.0` | 2026-02-03 |
| GHSA-hp3w-g68c-fv3c | `sprintf-js@1.0.3` | 2026-10-22 |
| GHSA-vfj7-8cjw-p6xm | `braces@3.0.3` | 2026-10-23 |
| GHSA-ch52-4w7c-c8xp | `http-cache-semantics@4.2.0` | 2026-10-28 |
| GHSA-gcqx-w48m-w2h4 | `deepmerge@4.2.2` | 2026-11-16 |

`http-cache-semantics@4.2.0` also left the tree with the `node-gyp` bump above, so its withdrawn alert disappears with the next scan.

One more alert is a scanner artefact rather than a withdrawn advisory: Dependency-Track reports GHSA-g3hv-75wg-m249 against
`minimatch@3.1.5`, but the advisory affects `>= 7.0.0 < 11.0.1` and 3.1.5 is outside it (zero advisories against it in the API).
The 3.x line has no fix because it needs none. Dismiss it as a false positive.

### Summary of the open set after the November round

Three findings stay open: `react-router` ×2 (needs a major) and `elliptic` (no fix). Five withdrawn advisories still in the
tree (`esbuild`, `eslint`, `sprintf-js`, `braces`, `deepmerge`) and one false positive (`minimatch@3.1.5`) need dismissing in
the scanner. `http-cache-semantics` left the tree.
