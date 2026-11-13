// @ts-check
// Dependency rules DEP-01–DEP-06 — see specs/003-monorepo-tooling/design.md §3.

/** @type {import('@yarnpkg/types')} */
const { defineConfig } = require('@yarnpkg/types');

const GAME_ENGINE = '@tetris/game-engine';

/** @param {import('@yarnpkg/types').Yarn.Constraints.Workspace} ws */
const isApp = (ws) => ws.cwd.startsWith('apps/');
/** @param {import('@yarnpkg/types').Yarn.Constraints.Workspace} ws */
const isPackage = (ws) => ws.cwd.startsWith('packages/');

module.exports = defineConfig({
  async constraints({ Yarn }) {
    // DEP-06: every workspace (except root) is private ESM.
    for (const ws of Yarn.workspaces()) {
      if (ws.cwd === '.') continue;
      ws.set('private', true);
      ws.set('type', 'module');
    }

    /** @type {Map<string, string>} first-seen range per external dependency */
    const canonicalRanges = new Map();

    for (const dep of Yarn.dependencies()) {
      const target = Yarn.workspace({ ident: dep.ident });

      if (target) {
        // DEP-01: internal dependencies use the workspace protocol.
        dep.update('workspace:^');

        // DEP-02: packages never depend on apps.
        if (isPackage(dep.workspace) && isApp(target)) {
          dep.error(`DEP-02: ${dep.workspace.ident} (packages/*) must not depend on ${dep.ident} (apps/*)`);
        }

        // DEP-03: apps never depend on other apps.
        if (isApp(dep.workspace) && isApp(target)) {
          dep.error(`DEP-03: ${dep.workspace.ident} must not depend on another app (${dep.ident})`);
        }
      }

      // DEP-04: the game engine has no runtime or peer dependencies.
      if (dep.workspace.ident === GAME_ENGINE && dep.type !== 'devDependencies') {
        dep.error(`DEP-04: ${GAME_ENGINE} must not declare ${dep.type} (${dep.ident})`);
      }

      // DEP-05: one range per external dependency across the repo.
      if (!target && dep.type !== 'peerDependencies') {
        const canonical = canonicalRanges.get(dep.ident);
        if (canonical === undefined) {
          canonicalRanges.set(dep.ident, dep.range);
        } else {
          dep.update(canonical);
        }
      }
    }
  },
});
