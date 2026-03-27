# Changelog

All notable changes to TaskBoard are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [0.2.7] - 2026-03-27

### Added

- **Monitoring Screen**: Real-time visualization of agent thinking, execution flows, and live task transitions.
- **Live Flow Chart**: New `FlowFeed` component to track live task transitions and events in real-time.
- **TaskOps Schema v6 Support**: Full compatibility with TaskOps v0.2.6+ databases, including `AgentEvents`, `Workflows`, and `Checkpoints`.
- **Advanced Task Properties**: Visualization of task dependencies (`depends_on`), parallel groups, and sequential ordering (`seq_order`).
- **Detailed Agent Events**: Support for tracking tool use, skills, thinking tokens, and duration for Claude and Gemini sessions.
- **Monitoring Guide**: Added comprehensive documentation for the new monitoring features in `docs/monitoring-guide.md`.

### Changed

- **Task Operations**: Enhanced diagram view with more detailed metadata and improved layout.
- **Dashboard**: Updated to show advanced task properties and better status visualization.

---

## [0.2.6] - 2026-03-22

### Changed

- App version updated to 0.2.6

---

## [0.2.5] — 2026-03-21

### Changed

- Internal version bump

---

## [0.2.4] — 2026-03-20

### Added

- **TaskOps Schema v4 Support**: Added `workflow_id` to `Operation` and `Resource` models and queries, enabling workflow-level data association and filtering.
- **Objectives Support**: Full integration of the 'objective' ETS component type.
  - **Dashboard**: New "Objectives" section for visualizing milestones and deadlines (`milestone_target`, `due_date`).
  - **Task Operations**: Objectives now appear in the sidebar for operation history viewing.
  - **Queries**: Added `getObjectives` and updated `getProjectSummary` to include objective counts.
- **Enhanced Task Details**: The Dashboard now displays `todo` implementation notes and `interrupt` reasons for tasks and subtasks.
- **Workflow Filtering (Electron)**: Added a workflow selector to the Task Operations screen to filter the task list.
- **Resource Grouping (Electron)**: Resources are now visually grouped by their associated workflow.

### Fixed

- **Electron — `better-sqlite3` ABI mismatch**: Added `postinstall` hook to `packages/electron` that automatically downloads the Electron-specific prebuilt binary after `pnpm install`. Users no longer need to run `pnpm rebuild:electron` manually after cloning.

### Changed

- **`pnpm dev:electron`**: Now builds core + Electron and launches the compiled app (`electron .`), matching the TUI workflow (`pnpm build:electron` → `pnpm dev:electron`). The Vite hot-reload workflow is still available via `pnpm dev` inside `packages/electron`.
- **README / README.ko.md**: Updated Electron setup instructions to reflect the automatic `postinstall` rebuild and the simplified `dev:electron` workflow.

---

## [0.2.3] — 2026-03-16

### Added

- **Operation detail panel (TUI)**: `↑`/`↓` keys now move a cursor through the operation list. The selected operation's tool, skill, MCP, token usage, duration, and retry count are shown in a detail panel below the list.
- **Expanded operation nodes (Electron)**: ReactFlow operation cards now display tool/skill/MCP badges, token counts (in/out), duration, and retry count when the data is present (schema v2 DBs).
- **Task token summary (Electron)**: The task header now shows total input/output token counts and total duration for all operations on the selected task (when token data is available).
- **Schema v2 fields in `Operation` model**: `tool_name`, `skill_name`, `mcp_name`, `retry_count`, `input_tokens`, `output_tokens`, `duration_seconds` added as optional fields — fully backward-compatible with schema v1 DBs.

---

## [0.2.2] - 2026-03-15

### Added

#### Core (`@taskboard/core`)
- `getProjectList`: supports direct path — if `taskops.db` exists in the given folder itself, returns it as a single project without scanning subdirectories
- `getProjectList`: recursive scan up to depth 3, enabling discovery of deeply nested project structures

#### TUI App (`@taskboard/tui`)
- **Dashboard** — keyboard navigation: `↑`/`↓` to move between tasks, `Enter` to jump to Task Operations for the selected task
- **Dashboard** — virtual scrolling with scroll indicators when task list exceeds terminal height; auto-scrolls to keep the selected row visible
- **Task Operations** — `↑`/`↓` scrolling for the operation list
- **Task Operations** — opening the screen from Dashboard pre-selects the task navigated from
- **Task Operations** — sliding window task bar (shows 5 tasks at a time) to prevent single-line overflow on wide task lists
- Alternate screen buffer on launch — hides previous shell output and restores terminal on exit / SIGINT / SIGTERM
- `--path` argument now resolved relative to `INIT_CWD` (pnpm dev mode) or `cwd()`

#### Electron App (`@taskboard/electron`) _(experimental)_
- `scripts/rebuild-native.js` — helper script to install the Electron-specific prebuilt binary for `better-sqlite3` (`pnpm rebuild:electron`)
- `@electron/rebuild` and `cross-env` added as dev dependencies
- `base: './'` in `vite.config.ts` for correct asset paths in packaged builds
- `sandbox: false` in `BrowserWindow` options for native module compatibility

### Changed

#### Core (`@taskboard/core`)
- `better-sqlite3` upgraded from v9 to v11.10.0; `@types/better-sqlite3` upgraded to v7.6.12

#### TUI App (`@taskboard/tui`)
- Dev script switched from `ts-node` to `tsx` for faster TypeScript execution
- Screen content box gets `key={screen}` to force full remount on tab switch
- Screen content box gets `flexDirection="column"` for correct Ink layout

#### Electron App (`@taskboard/electron`) _(experimental)_
- `dev` script now sets `NODE_ENV=development` via `cross-env` for reliable environment detection
- `dialog.showOpenDialog` now receives `mainWindow` as parent window argument
- `ProjectSelect` loading state managed with `try/finally` to prevent stuck spinner on cancellation

#### Project structure
- `fixtures/` directory renamed to `example/`; `fixture.db` → `sample.db`; `create-fixture.js` → `create-sample-db.js`
- English README added as the primary `README.md`; Korean content moved to `README.ko.md`
- `CLAUDE.md` and `AGENTS.md` added for AI-assisted development guidance

### Fixed

#### TUI App (`@taskboard/tui`)
- Ghost lines left on screen when switching tabs (fixed by `key={board.screen}` remount)
- Task bar wrapping to multiple lines on screens with many tasks (fixed by sliding window)

#### Electron App (`@taskboard/electron`) _(experimental)_
- `better-sqlite3` native module ABI mismatch when running under Electron (fixed by `rebuild:native` script and `sandbox: false`)

---

## [0.1.0] - 2026-03-15

### Added

#### Monorepo & Core (`@taskboard/core`)
- pnpm workspaces monorepo with `core`, `tui`, `electron` packages
- TypeScript data models: `Task`, `Operation`, `Resource`, `Setting`, `ProjectInfo`, `EpicWithTasks`
- Read-only SQLite connection via `better-sqlite3` (`openDb` / `closeDb`)
- Query functions: `getProject`, `getEpicsWithTasks`, `getWorkflowOrder`, `getOperations`, `getResources`, `getSettings`, `getProjectList`, `getProjectSummary`
- DB file watcher with chokidar + 3-second polling fallback (`watch`)
- Unit tests for all core modules (Vitest)
- Test fixture DB (`fixtures/fixture.db`) with 2 epics, 5 tasks, 6 operations, 3 resources

#### TUI App (`@taskboard/tui`)
- Ink 5 terminal app, launchable via `npx taskboard-tui`
- CLI argument `--path <taskops-root>` for non-interactive startup
- **ProjectSelect** screen — folder path input + project list selection
- **Dashboard** screen — Epic/Task hierarchy with status icons and progress bars
- **TaskOperations** screen — task selector + operation flow timeline
- **Resources** screen — resource file list with type color coding
- **Settings** screen — key/value settings table
- Tab-key navigation between screens; `R` refresh; `Q` quit
- Component tests with ink-testing-library

#### Electron App (`@taskboard/electron`)
- Electron 33 + React 18 + Vite + Tailwind CSS desktop app
- Secure IPC architecture: renderer never accesses SQLite directly
- Main process handles all DB queries and file watching
- Context-bridge preload exposes `window.taskboard` API to renderer
- OS-native folder selection dialog (`dialog.showOpenDialog`)
- **ProjectSelect** screen — folder picker + project cards
- **Dashboard** screen — summary cards with status breakdown and Epic/Task hierarchy
- **TaskOperations** screen — ReactFlow node-edge operation diagram with hierarchy breadcrumb
- **Resources** screen — resource list with type badges
- **Settings** screen — settings table
- Sidebar navigation with active state highlighting
- Playwright E2E test scaffold
- electron-builder packaging config (`electron-builder.json5`)
