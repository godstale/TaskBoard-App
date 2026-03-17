# TaskBoard App — Architecture & Implementation Reference

> Version 0.2.x | 2026-03-17

---

## Overview

TaskBoard App is a read-only Electron desktop app for visualizing [TaskOps](https://github.com/godstale/TaskOps) projects.
It reads the `taskops.db` SQLite database produced by TaskOps and renders the project's Epic/Task hierarchy, operation history, and resources.

---

## Project Structure

```
TaskBoard-App/
├── src/
│   ├── core/                     # Shared business logic (DB + watcher)
│   │   ├── index.ts              # Re-exports everything
│   │   ├── models.ts             # TypeScript interfaces
│   │   ├── db.ts                 # SQLite connection (better-sqlite3)
│   │   ├── queries.ts            # Read-only query functions
│   │   └── watcher.ts            # DB file watcher (chokidar)
│   ├── main/                     # Electron main process
│   │   ├── index.ts              # Main process entry point
│   │   ├── ipc.ts                # IPC channel name constants
│   │   └── preload.ts            # Context-bridge (window.taskboard)
│   └── renderer/                 # React 18 renderer
│       ├── index.html
│       ├── main.tsx              # React entry point
│       ├── App.tsx               # Root component + screen routing
│       ├── useTaskBoard.ts       # Renderer state hook (via IPC)
│       ├── global.css            # Tailwind base styles
│       ├── components/
│       │   └── Sidebar.tsx
│       └── screens/
│           ├── ProjectSelect.tsx
│           ├── Dashboard.tsx
│           ├── TaskOperations.tsx
│           ├── Resources.tsx
│           └── Settings.tsx
├── tests/
│   ├── electron.test.ts          # Vitest unit tests
│   └── e2e/                      # Playwright E2E tests
├── example/
│   ├── sample.db                 # Sample SQLite DB (manual testing)
│   ├── create-sample-db.js       # Script to regenerate sample.db
│   ├── sample/                   # Sample TaskOps project folder
│   └── TaskOps_Test/             # Another sample TaskOps project folder
├── vite.config.ts
├── tsconfig.json                 # Renderer (ESNext + DOM)
├── tsconfig.main.json            # Main process (CommonJS)
└── electron-builder.json5
```

---

## Data Models (`src/core/models.ts`)

```typescript
type TaskStatus    = 'todo' | 'in_progress' | 'interrupted' | 'done' | 'cancelled'
type TaskType      = 'project' | 'epic' | 'task' | 'objective'
type OperationType = 'start' | 'progress' | 'complete' | 'error' | 'interrupt'
type ResourceType  = 'input' | 'output' | 'reference' | 'intermediate'

interface Task       { id, project_id, type, title, status, parent_id, seq_order, ... }
interface Operation  { id, task_id, operation_type, agent_platform, summary,
                       tool_name?, skill_name?, mcp_name?, retry_count?,
                       input_tokens?, output_tokens?, duration_seconds?, ... }
interface Resource   { id, task_id, file_path, res_type, ... }
interface Setting    { key, value, description, updated_at }

// Composite types used by the renderer
interface EpicWithTasks    { epic: Task; tasks: TaskWithChildren[] }
interface TaskWithChildren { task: Task; children: Task[] }
interface ProjectSummary   { project, totalEpics, totalTasks, tasksByStatus }
```

---

## Query Functions (`src/core/queries.ts`)

| Function | Returns |
|----------|---------|
| `getProject(db)` | Root project row (`type = 'project'`) |
| `getEpicsWithTasks(db)` | Nested Epic → Task → SubTask hierarchy |
| `getWorkflowOrder(db)` | All tasks sorted by `seq_order` |
| `getOperations(db, taskId?)` | All or per-task operation history |
| `getResources(db, taskId?)` | All or per-task resource files |
| `getSettings(db)` | All settings rows |
| `getProjectList(root)` | Subdirectories of `root` that contain `taskops.db` |
| `getProjectSummary(db)` | Aggregated task counts by status |

---

## DB Watcher (`src/core/watcher.ts`)

```
watch(dbPath, onChange) => unwatch

1. chokidar watches the file (fs.watch-based, low overhead)
2. On 'change' event → call onChange()
3. On chokidar error → fall back to setInterval(3000ms) polling
4. unwatch() closes chokidar and/or clears the poll timer
```

---

## Electron IPC Architecture

```
Main Process                           Renderer Process
────────────────                       ─────────────────────────────────
better-sqlite3 queries   ──IPC──▶     window.taskboard.getAllData()
chokidar watcher         ──IPC──▶     window.taskboard.onDbChanged()
dialog.showOpenDialog    ◀──IPC──     window.taskboard.selectFolder()
getProjectList()         ──IPC──▶     window.taskboard.getProjectList()
```

The renderer **never** accesses the filesystem directly. All data flows through the preload context-bridge (`src/main/preload.ts`) which exposes `window.taskboard`.

### IPC Channels (`src/main/ipc.ts`)

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `get-project-list` | renderer → main (invoke) | Scan taskops root for projects |
| `get-all-data` | renderer → main (invoke) | Load full DB snapshot + start watcher |
| `select-folder` | renderer → main (invoke) | Open OS folder dialog |
| `db-changed` | main → renderer (send) | Notify renderer to reload |

---

## Renderer State Hook (`src/renderer/useTaskBoard.ts`)

```typescript
useTaskBoard(dbPath: string | null)
// → { data, selectedTaskId, setSelectedTaskId, screen, setScreen, reload }

// On dbPath change:
//   1. getAllData(dbPath) via IPC → setData()
//   2. onDbChanged listener → reload on next change
//   3. cleanup: offDbChanged() on unmount / path change
```

---

## Screen Flow

```
App launch
    │
    └──▶ ProjectSelect (folder picker → scan for taskops.db)
              │  select project
          App (tab navigation)
    ┌─────────┼─────────┬─────────┐
Dashboard  TaskOps  Resources  Settings
```

### Screens

| Screen | Description |
|--------|-------------|
| **ProjectSelect** | OS folder picker + project list |
| **Dashboard** | Summary cards + Epic/Task hierarchy |
| **TaskOperations** | ReactFlow node-edge diagram of operation history |
| **Resources** | Resource list with type badges |
| **Settings** | Key/value settings table |

---

## Build

- **Renderer**: Vite (`src/renderer/` → `dist/renderer/`)
- **Main process**: `tsc -p tsconfig.main.json` (`src/main/` → `dist/main/`)
- **Packaging**: electron-builder (`electron-builder.json5`)

```bash
pnpm build    # renderer + main
pnpm package  # → release/ (NSIS / dmg / AppImage)
```

---

## Testing Strategy

| Layer | Tool | Coverage |
|-------|------|----------|
| Core (db, queries, watcher) | Vitest | DB open/close, all query functions, watcher callback |
| Renderer components | Vitest + React Testing Library | Screen rendering |
| App end-to-end | Playwright | App launch, screen navigation, data display |

### Sample DB (`example/sample.db`)

Pre-built SQLite DB for manual app testing:
- 1 project (`FIX`)
- 2 epics, 5 tasks (including 2 sub-tasks)
- 6 operations across 2 tasks
- 3 resources (input / output / intermediate)
- 3 settings entries

Regenerate: `node example/create-sample-db.js`

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Language | TypeScript 5.4 |
| Package manager | pnpm 8 |
| Core | better-sqlite3, chokidar |
| Desktop | Electron 33, React 18, Vite 5, Tailwind CSS 3 |
| Flow diagram | ReactFlow 11 |
| Testing | Vitest, React Testing Library, Playwright |
| Packaging | electron-builder 24 |
