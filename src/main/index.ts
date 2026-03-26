import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import {
  openDb, closeDb, getProject, getEpicsWithTasks, getWorkflowOrder, getObjectives,
  getOperations, getResources, getSettings, getWorkflows, getCheckpoints,
  getProjectList, watch, getSchemaVersion, getAgentEvents,
  findClaudeProjectDir, findGeminiProjectDir, parseClaudeLog, parseGeminiLog
} from '../core/index.js'
import { IPC } from './ipc'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null
let currentUnwatch: (() => void) | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  // Folder selection dialog
  ipcMain.handle(IPC.SELECT_FOLDER, async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: 'Select TaskOps Root Folder',
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // Project list query
  ipcMain.handle(IPC.GET_PROJECT_LIST, (_, taskopsRoot: string) => {
    return getProjectList(taskopsRoot)
  })

  // All data query (after project selection)
  ipcMain.handle(IPC.GET_ALL_DATA, (_, dbPath: string) => {
    // Unwatch previous
    currentUnwatch?.()

    const db = openDb(dbPath)
    const schemaVersion = getSchemaVersion(db)
    const data = {
      project: getProject(db),
      epics: getEpicsWithTasks(db),
      objectives: getObjectives(db),
      workflowOrder: getWorkflowOrder(db),
      workflows: getWorkflows(db),
      operations: getOperations(db),
      resources: getResources(db),
      settings: getSettings(db),
      checkpoints: getCheckpoints(db),
      schemaVersion,
      agentEvents: schemaVersion >= 7 ? getAgentEvents(db) : []
    }
    closeDb(db)

    // Watch for changes
    currentUnwatch = watch(dbPath, () => {
      mainWindow?.webContents.send(IPC.DB_CHANGED, dbPath)
    })

    return data
  })

  ipcMain.handle(IPC.GET_AGENT_EVENTS, (_, dbPath: string, workflowId?: string) => {
    const db = openDb(dbPath)
    const events = getAgentEvents(db, workflowId)
    closeDb(db)
    return events
  })

  ipcMain.handle(IPC.DISCOVER_LOGS, (_, projectPath: string) => {
    const claudeDir = findClaudeProjectDir(projectPath)
    const geminiDir = findGeminiProjectDir(projectPath)
    
    const claudeLogs = claudeDir && fs.existsSync(claudeDir) 
      ? fs.readdirSync(claudeDir)
          .filter(f => f.endsWith('.jsonl'))
          .map(f => path.join(claudeDir, f))
      : []
    
    const geminiLogs = geminiDir && fs.existsSync(geminiDir)
      ? fs.readdirSync(geminiDir)
          .filter(f => f.endsWith('.json'))
          .map(f => path.join(geminiDir, f))
      : []

    return { claudeLogs, geminiLogs }
  })

  ipcMain.handle(IPC.GET_CLAUDE_LOG, async (_, filePath: string) => {
    return await parseClaudeLog(filePath)
  })

  ipcMain.handle(IPC.GET_GEMINI_LOG, (_, filePath: string) => {
    return parseGeminiLog(filePath)
  })

  ipcMain.handle(IPC.OPEN_IN_FOLDER, (_, filePath: string) => {
    if (fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath)
    } else {
      // If it's a directory
      const dirPath = path.dirname(filePath)
      if (fs.existsSync(dirPath)) {
        shell.openPath(dirPath)
      }
    }
  })
})

app.on('window-all-closed', () => {
  currentUnwatch?.()
  if (process.platform !== 'darwin') app.quit()
})
