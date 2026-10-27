# Non-AI Git workspace implementation

Scope reference (2026-10-27): https://gitkraken.com/pricing and https://help.gitkraken.com/gitkraken-desktop/gitkraken-desktop-home/ . These references cover Desktop and the paid platform; they are not a claim of implemented parity. AI generation, assistants, agents and MCP are excluded.

## This development branch

Implemented with real Git commands and form UI, pending desktop interaction QA:
- Branch create, switch (clean tree), rename, safe delete.
- Remotes add/list/remove; fetch/prune, fast-forward pull, push with upstream.
- Lightweight/annotated tags and local tag deletion.
- Stash including untracked files, preview, apply/pop/drop.
- Merge, rebase, cherry-pick, revert; conflict state, manual resolution staging, continue/abort.
- Soft undo of the last commit, reflog, ref comparison, file history/blame.
- Worktree add/list/remove, clone/init and searchable command palette.
- Local integration tests exercise branches, tags, stash, conflict recovery, bare remote push/fetch, clone, worktree and undo.

Uses existing Git credentials/SSH agent and Git signing/hooks configuration. No provider OAuth or in-app credential management yet. Network operations currently time out after 30 seconds. This branch is not a released build.

## Still to implement and validate

- Graph virtualisation, drag/drop operations, multi-commit selection, branch solo/hide, true history search beyond loaded commits.
- Hunk/line staging, ignore editor, discard with recovery, side-by-side diff, image/Markdown preview, file editor, three-way conflict editor.
- Interactive rebase reorder/squash/fixup/drop/reword, multi-cherry-pick, undo/redo journal, safe force-with-lease flow.
- Worktree lock/unlock, submodule management, LFS, Gitflow, embedded terminal and profiles.
- Recent/favourite repositories, multi-repository tabs/workspaces, deep links, preferences and themes.
- GitHub/GitLab/Bitbucket/Azure OAuth and enterprise/self-hosted connectors; PR creation/review/checkout, CI status and issue links.
- Jira Cloud/Data Center, Trello and provider issue trackers.
- Shared workspaces, Launchpad, team activity and proactive conflict prevention require a separate authenticated collaboration service.
- Organisation policy, SSO/SAML, administration and on-prem deployment require server-side infrastructure, identity configuration and independent security validation.
- GitLens IDE-specific features and standalone CLI platform features need separate extensions; they are not implemented by the desktop app.
- Windows/Linux packaging, notarized macOS distribution and end-to-end desktop QA.

## Branding

The original standalone p/Git concept is not selected. Existing pTerm and pZip both use a polar bear with a dark blue tile. Three family-level directions are under review: A shared bear silhouette with functional glyph; B shared bear holding a tool panel; C functional glyph plus a bear badge. No existing app icon has been changed.
