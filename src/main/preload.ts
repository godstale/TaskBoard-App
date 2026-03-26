import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from './ipc'

contextBridge.exposeInMainWorld('taskboard', {
  selectFolder: () => ipcRenderer.invoke(IPC.SELECT_FOLDER),
  getProjectList: (root: string) => ipcRenderer.invoke(IPC.GET_PROJECT_LIST, root),
  getAllData: (dbPath: string) => ipcRenderer.invoke(IPC.GET_ALL_DATA, dbPath),
  getAgentEvents: (dbPath: string, workflowId?: string) => ipcRenderer.invoke(IPC.GET_AGENT_EVENTS, dbPath, workflowId),
  discoverLogs: (projectPath: string) => ipcRenderer.invoke(IPC.DISCOVER_LOGS, projectPath),
  getClaudeLog: (filePath: string) => ipcRenderer.invoke(IPC.GET_CLAUDE_LOG, filePath),
  getGeminiLog: (filePath: string) => ipcRenderer.invoke(IPC.GET_GEMINI_LOG, filePath),
  openInFolder: (filePath: string) => ipcRenderer.invoke(IPC.OPEN_IN_FOLDER, filePath),
  onDbChanged: (cb: (dbPath: string) => void) =>
    ipcRenderer.on(IPC.DB_CHANGED, (_, dbPath) => cb(dbPath)),
  offDbChanged: () => ipcRenderer.removeAllListeners(IPC.DB_CHANGED),
})
