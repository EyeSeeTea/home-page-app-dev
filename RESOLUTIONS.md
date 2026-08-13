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

## Audit cadence

Re-audit the dependency tree monthly and before every release. A constraint that has silently
stopped working shows up as a finding that keeps coming back for a package that already has one.
Each entry below has a **drop when** condition — when it becomes true, delete the entry and
re-install.

Note that different scanners disagree on severity, so measure against the one the CI gate reads
before concluding the tree is clean, and do not mix sources when comparing.

---

## Active resolutions

### Security floors

#### `axios: ^1.18.0`

- **Why:** `axios` is a direct dependency and also arrives transitively through the DHIS2 API client
  and a dev-time wait helper, so a single floor is the simplest control over every path. It was
  previously the exact version `1.13.5`, which no patch could ever move.
- **Fixes:** 29 advisories — GHSA-hfxv-24rg-xrqf, GHSA-p92q-9vqr-4j8v, GHSA-j5f8-grm9-p9fc,
  GHSA-35jp-ww65-95wh, GHSA-777c-7fjr-54vf, GHSA-pjwm-pj3p-43mv, GHSA-3g43-6gmg-66jw,
  GHSA-q8qp-cvcw-x6jj, GHSA-62hf-57xw-28j9, GHSA-pf86-5x62-jrwf, GHSA-6chq-wfr3-2hj9,
  GHSA-pmwg-cvhr-8vh7 (high); GHSA-mwf2-3pr3-8698, GHSA-jqh4-m9w3-8hp9, GHSA-7q8q-rj6j-mhjq,
  GHSA-mmx7-hfxf-jppx, GHSA-42h9-826w-cgv3, GHSA-pmv8-rq9r-6j72, GHSA-898c-q2cr-xwhg,
  GHSA-3w6x-2g7m-8v23, GHSA-445q-vr5w-6q77, GHSA-m7pr-hjqh-92cm, GHSA-5c9x-8gcm-mpgx,
  GHSA-vf2m-468p-8v99, GHSA-xx6v-rp6x-q39c, GHSA-w9j2-pvgh-6h63, GHSA-fvcv-3m26-pcqx,
  GHSA-3p68-rc4w-qgx5 (medium); GHSA-xhjh-pmcv-23jw (low). Runtime-reachable — credential leakage to
  redirect targets and proxy-header forwarding.
- **Drop when:** no consumer requests `axios < 1.18`. Verify with `yarn why axios`.

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

#### `qs: ^6.15.3`

- **Why:** ⚠️ **Load-bearing.** Transitive, through the DHIS2 API client and the browser `url`
  polyfill. The API client requests an exact `6.9.7`, so removing the floor resolves `qs`
  *downwards* rather than upwards — verified by removing it and re-installing. Previously the exact
  version `6.15.0`.
- **Fixes:** GHSA-q8mj-m7cp-5q26 (medium) — unhandled `TypeError` in `qs.stringify` with
  `arrayFormat: 'comma'` and `encodeValuesOnly: true` over an array containing `null`.
- **Drop when:** every consumer requests `qs >= 6.15.2` natively. The API client is the blocker.

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
| `moment: ^2.29.4` | 2.30.1 | — | was exact, a minor behind |
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

## Remaining findings

Grouped by what would close them, because several share a single cause. The first group is closed;
the rest have no fix available at the time of writing.

### Resolved by the vite and vitest upgrade

Eight advisories that were open against this tree are closed by moving the build toolchain, not by
a constraint. They are recorded here because the upgrade is the remediation, and anyone reading the
manifest would otherwise see only version bumps.

`vite@4.5.14` carried GHSA-fx2h-pf6j-xcff and GHSA-c27g-q93r-2cwf (high), GHSA-93m4-6634-74q7,
GHSA-4w7w-66w2-5vf9 and GHSA-v6wh-96g9-6wx3 (medium), GHSA-g4jq-h2w9-997c and GHSA-jqfw-vq24-v9c3
(low). `vitest@0.34.6` carried GHSA-5xrq-8626-4rwp (critical) — the Vitest UI server can serve
arbitrary files. Every one of them is fixed only in a major beyond the one installed, so they cost
a single decision rather than eight.

The move is `vite ^4.2.0 → ^7.3.6`, `vitest ^0.34.0 → ^3.2.7`, `@vitejs/plugin-react ^3.1.0 →
^5.1.0` and `vite-plugin-checker ^0.6.2 → ^0.11.0`. It needed no change to `vite.config.ts` and no
change to any test.

**Stopping at `vite-plugin-checker` 0.11 is deliberate.** That line reaches vite 7 while still
declaring `eslint: ">=7"` as an optional peer, so the ESLint 7 toolchain here is untouched. Later
lines of the plugin are what force an ESLint upgrade, and nothing about these advisories requires
one.

It also removed the `vite/esbuild` resolution that used to be needed. vite 7 requests
`esbuild ^0.27.0 || ^0.28.0` on its own and resolves to 0.28.2, so a `^0.25.0` floor would now hold
esbuild *below* what its parent declares.

⚠️ **One thing worth knowing before revisiting this.** GHSA-c27g-q93r-2cwf and GHSA-v6wh-96g9-6wx3
each name *two* packages: `launch-editor <= 2.8.2` and `vite`. Constraining `launch-editor` looks
like a way to close both without upgrading, and it is not — under vite 4 `launch-editor` did not
appear in `yarn.lock` at all, because vite inlined it into `dist/node/chunks/`. A resolution
written against it installs cleanly and changes nothing.

### Closed by a React Router major — 3 advisories

- `react-router@6.30.4`: GHSA-wrjc-x8rr-h8h6 (affects `>= 6.0.0 < 7.18.0`) and GHSA-337j-9hxr-rhxg
  (affects `>= 6.4.0 < 7.18.0`), both medium. The fix exists only in 7.18.0.
- `react-router-dom@6.30.4`: GHSA-jjmj-jmhj-qwj2 (medium), affecting `>= 6.30.2 <= 6.30.4`. 6.30.4
  is the newest release on the 6.x line, so there is nothing to move to within the major.

The 6.x line has taken every patch it is going to take for these. Moving to React Router 7 is a
breaking change across the routing layer and belongs in its own change.

### No fix published — 1 advisory

- `elliptic@6.6.1`: GHSA-848j-6mx2-7j84 (low). The advisory affects `<= 6.6.1`, and 6.6.1 is the
  most recent release published, so there is no version to move to. Reached only through the
  browser crypto polyfills used by the bundler.

### Withdrawn advisories — dismissal, not remediation

Two advisories in the scan have been withdrawn upstream and describe no real vulnerability. They
need dismissing in the scanner rather than a code change; upgrading to "fix" them would be work that
corrects nothing.

- GHSA-gv7w-rqvm-qjhr against `esbuild` — withdrawn 2026-06-17.
- GHSA-p5wg-g6qr-c7cg against `eslint` — withdrawn 2026-02-03.
