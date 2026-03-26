import { useState, useEffect, useCallback } from 'react'
import type { 
  EpicWithTasks, Operation, Resource, Setting, ProjectInfo, Task, Workflow, Checkpoint,
  AgentEvent, ClaudeEvent, GeminiSession
} from '@taskboard/core'

declare global {
  interface Window {
    taskboard: {
      selectFolder: () => Promise<string | null>
      getProjectList: (root: string) => Promise<Array<{ name: string; dbPath: string }>>
      getAllData: (dbPath: string) => Promise<AllData>
      getAgentEvents: (dbPath: string, workflowId?: string) => Promise<AgentEvent[]>
      discoverLogs: (projectPath: string) => Promise<{ claudeLogs: string[], geminiLogs: string[] }>
      getClaudeLog: (filePath: string) => Promise<ClaudeEvent[]>
      getGeminiLog: (filePath: string) => Promise<GeminiSession | null>
      onDbChanged: (cb: (dbPath: string) => void) => void
      offDbChanged: () => void
    }
  }
}

export interface AllData {
  project: ProjectInfo | undefined
  epics: EpicWithTasks[]
  objectives: Task[]
  workflowOrder: Task[]
  workflows: Workflow[]
  operations: Operation[]
  resources: Resource[]
  settings: Setting[]
  checkpoints: Checkpoint[]
  schemaVersion: number
  agentEvents: AgentEvent[]
}

export type Screen = 'workflows' | 'dashboard' | 'taskops' | 'monitoring' | 'resources' | 'settings'

export function useTaskBoard(dbPath: string | null) {
  const [data, setData] = useState<AllData | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [workflowFilter, setWorkflowFilter] = useState<string>('all')
  const [logs, setLogs] = useState<{ claudeLogs: string[], geminiLogs: string[] }>({ claudeLogs: [], geminiLogs: [] })

  const reload = useCallback(async (path: string) => {
    const result = await window.taskboard.getAllData(path)
    setData(result)

    // Discover logs in the same directory as taskops.db
    const projectPath = path.substring(0, path.lastIndexOf(/[/\\]/))
    const logResult = await window.taskboard.discoverLogs(projectPath)
    setLogs(logResult)
  }, [])

  useEffect(() => {
    if (!dbPath) return
    reload(dbPath)
    window.taskboard.onDbChanged((changedPath) => {
      if (changedPath === dbPath) reload(dbPath)
    })
    return () => window.taskboard.offDbChanged()
  }, [dbPath, reload])

  return {
    data,
    selectedTaskId,
    setSelectedTaskId,
    screen,
    setScreen,
    workflowFilter,
    setWorkflowFilter,
    logs,
    reload: () => dbPath && reload(dbPath),
  }
}
