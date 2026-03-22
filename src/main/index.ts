import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import {
  openDb, closeDb, getProject, getEpicsWithTasks, getWorkflowOrder, getObjectives,
  getOperations, getResources, getSettings, getWorkflows, getCheckpoints,
  getProjectList, watch
} from '../core/index.js'
import { IPC } from './ipc'

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
    }
    closeDb(db)

    // Watch for changes
    currentUnwatch = watch(dbPath, () => {
      mainWindow?.webContents.send(IPC.DB_CHANGED, dbPath)
    })

    return data
  })
})

app.on('window-all-closed', () => {
  currentUnwatch?.()
  if (process.platform !== 'darwin') app.quit()
})
