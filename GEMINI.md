# TaskBoard App - Gemini Context

This file provides essential context for Gemini CLI when working on the TaskBoard App project.

## Project Overview
TaskBoard App is an **Electron 33 + React 18** desktop application designed for visualizing [TaskOps](https://github.com/godstale/TaskOps) projects. It provides a read-only interface to the `taskops.db` SQLite database produced by TaskOps, rendering task hierarchies, operation histories, and project resources.

### Core Technology Stack
- **Framework:** Electron 33, React 18 (Vite 5)
- **Language:** TypeScript 5.4
- **Styling:** Tailwind CSS 3
- **Database:** SQLite via `better-sqlite3` (Read-only)
- **File Watching:** `chokidar` (with polling fallback)
- **Diagrams:** `reactflow` (for Task Operations history)
- **Testing:** Vitest (unit), Playwright (E2E)

## Project Structure
```
TaskBoard-App/
├── src/
│   ├── core/       # Shared business logic: DB connection, models, queries, watcher
│   ├── main/       # Electron main process: IPC handlers, preload, window management
│   └── renderer/   # React renderer: Screens, components, hooks, global styles
├── docs/           # Architecture and schema documentation
├── tests/          # Vitest and Playwright test suites
├── example/        # Sample DB and scripts for local testing/development
├── scripts/        # Native module rebuild scripts
└── dist/           # Build output (ignored by git)
```

## Key Commands
- **Install:** `pnpm install` (Automatically runs native rebuild for `better-sqlite3`)
- **Development:** `pnpm dev` (Starts Vite dev server + Electron)
- **Build:** `pnpm build` (Compiles renderer via Vite and main process via tsc)
- **Package:** `pnpm package` (Generates installers via electron-builder)
- **Unit Test:** `pnpm test` (Runs Vitest)
- **E2E Test:** `pnpm test:e2e` (Runs Playwright)
- **Native Rebuild:** `pnpm rebuild:native` (Manual rebuild of `better-sqlite3`)
- **Sample Data:** `node example/create-sample-db.js` (Regenerates `example/sample.db`)

## Development Conventions

### 1. Data Integrity (Read-Only)
The application **MUST NEVER** write to the `taskops.db`. All database interactions in `src/core/queries.ts` must use `SELECT` statements only.

### 2. IPC Architecture
- The **Renderer Process** has no direct access to the filesystem or database.
- All data fetching and system operations must go through the **Preload Context Bridge** (`src/main/preload.ts`).
- IPC channel constants are defined in `src/main/ipc.ts`.
- Use the `useTaskBoard` hook (`src/renderer/useTaskBoard.ts`) for managing application state in the renderer.

### 3. TypeScript Standards
- Adhere to strict TypeScript configurations.
- Avoid the use of `any`; define interfaces in `src/core/models.ts` for all data structures.
- Use composite types (e.g., `EpicWithTasks`) for complex UI data requirements.

### 4. Styling
- Use **Tailwind CSS** for all component styling.
- Maintain consistent spacing and interactive feedback as defined in the existing screens.

### 5. Testing
- Bug fixes should include a reproduction case in `tests/electron.test.ts`.
- UI changes should be verified with `pnpm test:e2e`.

## Architecture Details
Refer to `docs/architecture.md` for a deep dive into the data models, query functions, and the file-watching mechanism.
