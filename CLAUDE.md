# TaskBoard App — Claude Code Guide

> Quick reference for Claude Code. Full architecture details → [`docs/architecture.md`](docs/architecture.md)

---

## Project Overview

TaskBoard App is an **Electron 33 + React 18 desktop app** for visualizing [TaskOps](https://github.com/godstale/TaskOps) projects.
It reads `taskops.db` (SQLite) produced by TaskOps in read-only mode and renders the Epic/Task hierarchy, operation history, and resources.

---

## Project Structure

```
TaskBoard-App/
├── src/
│   ├── core/        # DB connection, queries, file watcher (shared business logic)
│   ├── main/        # Electron main process (IPC, preload, context-bridge)
│   └── renderer/    # React 18 renderer (screens, components, state hook)
├── tests/
│   ├── electron.test.ts    # Vitest unit tests
│   └── e2e/                # Playwright E2E tests
├── example/
│   ├── sample.db              # Standalone sample SQLite DB (manual testing)
│   ├── create-sample-db.js    # Script to regenerate sample.db
│   ├── sample/                # Sample TaskOps project folder (contains taskops.db)
│   └── TaskOps_Test/          # Another sample TaskOps project folder
├── docs/
│   └── architecture.md        # Detailed architecture reference ← READ THIS FIRST
├── CHANGELOG.md
├── README.md                  # English README
└── README.ko.md               # Korean README
```

---

## Key Commands

```bash
# Install all dependencies (also rebuilds better-sqlite3 for Electron via postinstall)
pnpm install

# Build renderer (Vite) + main process (tsc)
pnpm build

# Dev mode — Vite dev server + Electron (open folder via UI after launch)
pnpm dev

# Run Vitest unit tests
pnpm test

# Run Playwright E2E tests
pnpm test:e2e

# Package installer (Windows: .exe NSIS, macOS: .dmg, Linux: .AppImage)
pnpm package

# Manually rebuild better-sqlite3 for Electron (needed after upgrading electron or better-sqlite3)
pnpm rebuild:native

# Regenerate sample.db
node example/create-sample-db.js
```

---

## Architecture Reference

→ [`docs/architecture.md`](docs/architecture.md)

Key sections:
- **Data models** — `Task`, `Operation`, `Resource`, `Setting`, composite types
- **Query functions** — `getProject`, `getEpicsWithTasks`, `getOperations`, `getResources`, etc.
- **DB watcher** — chokidar + 3 s polling fallback
- **Electron IPC** — channels, preload context-bridge, renderer state hook
- **Screen flow** — ProjectSelect → Dashboard / TaskOperations / Resources / Settings
- **Testing strategy** — Vitest (unit), Playwright E2E

---

## Core Concepts

### Data Flow
```
taskops.db (SQLite)
  └── src/core (better-sqlite3)
        └── src/main (Electron main process)
              ├── IPC channels
              └── src/renderer (React)
                    └── window.taskboard (context-bridge)
```

### DB Schema (read-only)

| Table | Key columns |
|-------|-------------|
| `tasks` | `id`, `project_id`, `type` (project/epic/task/objective), `status`, `parent_id`, `seq_order` |
| `operations` | `id`, `task_id`, `operation_type` (start/progress/complete/error/interrupt), `summary` |
| `resources` | `id`, `task_id`, `file_path`, `res_type` (input/output/reference/intermediate) |
| `settings` | `key`, `value`, `description` |

### TypeScript Types (`src/core/models.ts`)
```typescript
type TaskStatus    = 'todo' | 'in_progress' | 'interrupted' | 'done' | 'cancelled'
type TaskType      = 'project' | 'epic' | 'task' | 'objective'
type OperationType = 'start' | 'progress' | 'complete' | 'error' | 'interrupt'
type ResourceType  = 'input' | 'output' | 'reference' | 'intermediate'
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript 5.4 |
| Package manager | pnpm 8 |
| Core | better-sqlite3, chokidar |
| Desktop | Electron 33, React 18, Vite 5, Tailwind CSS 3 |
| Flow diagram | ReactFlow 11 |
| Testing | Vitest, React Testing Library, Playwright |
| Packaging | electron-builder 24 |

---

## Testing

- **Sample DB**: `example/sample.db` — 1 project (`FIX`), 2 epics, 5 tasks, 6 operations, 3 resources, 3 settings (for manual app testing)
- **Unit tests**: `tests/electron.test.ts` — Vitest
- **E2E tests**: `tests/e2e/` — Playwright

---

## Coding Conventions

- **Read-only**: TaskBoard never writes to `taskops.db`. All query functions are SELECT only.
- **IPC boundary**: The renderer process **never** accesses the filesystem or SQLite directly. All data flows through `window.taskboard` (preload context-bridge in `src/main/preload.ts`).
- **TypeScript strict**: Strict TypeScript throughout. Avoid `any`.

---

## Related

- [TaskOps](https://github.com/godstale/TaskOps) — the AI agent project management tool that produces `taskops.db`
- [`CHANGELOG.md`](CHANGELOG.md) — version history
