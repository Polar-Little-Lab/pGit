# Dependency security review - 2026-11-13

Baseline: e6cf13fe2c0f90f398f24e9586498342c9c45211.

## Changes

- Electron 40.0.0 -> 45.3.1 (supported major).
- electron-builder 26.0.12 -> 26.18.0.
- Regenerated package-lock.json; tar 6.2.1 -> 7.5.23,
  builder-util-runtime 9.3.1 -> 9.7.0; extract-zip removed.
- Added daily npm and weekly GitHub Actions Dependabot updates and an audit gate including devDependencies.
- Playwright 1.58.2 -> 1.65.0 as part of the reviewed Dependabot updates.

## Compatibility

Electron 44 and later require macOS 13 Ventura or newer. This update therefore
drops macOS 12 support. Windows x64 and macOS arm64/x64 packaging still require
native build and launch verification before release. No binaries were released.

## Audit results

`npm audit --json`: 18 affected package entries (1 critical, 13 high, 4 moderate)
before; 6 moderate, 0 high, 0 critical after. Counts include parent packages
affected by a transitive dependency and are not unique exploitable vulnerabilities.

Remaining: minimatch GHSA-g3hv-75wg-m249 (globparts amplification denial of
service), propagated through @electron/universal, app-builder-lib, dmg-builder,
electron-builder and electron-builder-squirrel-windows. Used in build tooling;
end-user exploitability is not demonstrated. npm proposes electron-builder 25.1.0,
a downgrade: do not use audit fix --force. Track an upstream compatible fix;
do not silently override minimatch to a different major without packaging tests.

## Initial review validation (2026-11-13)

- npm test: 112 tests, 111 passed, 1 skipped, 0 failed.
- UI suite attempted using system Chromium; blocked at browser startup by the
  execution environment (`socket() failed: Operation not permitted`).
- Windows/macOS native package and Electron launch tests remain pending.
- Existing Verify Git workflows CI covers unit and browser UI tests on Linux
  and Windows. It does not replace native macOS/Electron release verification.

## Follow-up hardening (not confirmed exploits)

- Remove script-src unsafe-inline with nonces or external scripts.
- Developer ID signing, notarization and hardened runtime are now configured for
  macOS releases, with codesign, stapler and Gatekeeper checks before publication.
- Inventory installed Git, gh and glab versions separately; they are not pinned
  by package-lock.json and were not audited on end-user machines.
- Retain third-party license notices and review bundled logo redistribution terms.

## Sources

- https://releases.electronjs.org/schedule
- https://releases.electronjs.org/release/v44.0.0
- https://github.com/advisories/GHSA-h7rp-cf8h-j98x
- https://github.com/advisories/GHSA-8qq5-rm4j-mr97
- https://github.com/advisories/GHSA-p2f4-r6v6-j797
- https://github.com/advisories/GHSA-g3hv-75wg-m249

Audit is a dependency and targeted source review, not a penetration test or
proof that all application/runtime/native-binary vulnerabilities are absent.


## 1.1.1 follow-up - 2026-11-14

Applied a version-scoped override from minimatch >=7 <11.0.1 to 11.0.1.
This replaces the vulnerable 9.x/10.x build-tool paths while leaving legacy
3.x/5.x callable APIs intact. Upstream electron-builder remains 26.18.0;
no downgrade was used. The newer minimatch retains the named CommonJS exports
used by app-builder-lib and @electron/universal.

`npm audit --include=dev`: 0 vulnerabilities (previously 6 moderate entries
from one advisory). Local unit tests: 115 passed. The release workflow must
also pass native packaging, launch and signed macOS notarization checks before
publication; these are required compatibility checks for the major override.
