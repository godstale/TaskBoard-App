// IPC channel name constants — shared between main and renderer
export const IPC = {
  // renderer → main (invoke)
  GET_PROJECT_LIST: 'get-project-list',
  GET_ALL_DATA: 'get-all-data',
  SELECT_FOLDER: 'select-folder',
  GET_AGENT_EVENTS: 'get-agent-events',
  DISCOVER_LOGS: 'discover-logs',
  GET_CLAUDE_LOG: 'get-claude-log',
  GET_GEMINI_LOG: 'get-gemini-log',
  OPEN_IN_FOLDER: 'open-in-folder',
  // main → renderer (send)
  DB_CHANGED: 'db-changed',
} as const
