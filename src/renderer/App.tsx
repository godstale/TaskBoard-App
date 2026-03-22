import React, { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { useTaskBoard } from './useTaskBoard'
import { ProjectSelect } from './screens/ProjectSelect'
import { Dashboard } from './screens/Dashboard'
import { TaskOperations } from './screens/TaskOperations'
import { Resources } from './screens/Resources'
import { Settings } from './screens/Settings'
import { Workflows } from './screens/Workflows'

export function App() {
  const [dbPath, setDbPath] = useState<string | null>(null)
  const { 
    data, 
    selectedTaskId, 
    setSelectedTaskId, 
    screen, 
    setScreen,
    workflowFilter,
    setWorkflowFilter
  } = useTaskBoard(dbPath)

  if (!dbPath || !data) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <ProjectSelect onSelect={setDbPath} />
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-gray-950 text-gray-100">
      <Sidebar
        current={screen}
        onSelect={setScreen}
        projectName={data.project?.title}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Header with Workflow Selector */}
        <header className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-950 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              {screen === 'workflows' && 'Workflows'}
              {screen === 'dashboard' && 'Dashboard'}
              {screen === 'taskops' && 'Task Operations'}
              {screen === 'resources' && 'Resources'}
              {screen === 'settings' && 'Settings'}
            </h2>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Workflow</span>
            <select
              value={workflowFilter}
              onChange={(e) => setWorkflowFilter(e.target.value)}
              className="bg-transparent text-sm text-blue-400 font-medium outline-none cursor-pointer"
            >
              <option value="all">All Workflows</option>
              {data.workflows.map(w => (
                <option key={w.id} value={w.id}>{w.title || w.id}</option>
              ))}
            </select>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {screen === 'workflows' && <Workflows workflows={data.workflows} />}
          {screen === 'dashboard' && <Dashboard data={data} workflowFilter={workflowFilter} />}
          {screen === 'taskops' && (
            <TaskOperations
              data={data}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              workflowFilter={workflowFilter}
            />
          )}
          {screen === 'resources' && (
            <Resources 
              resources={data.resources} 
              workflows={data.workflows} 
              workflowFilter={workflowFilter}
            />
          )}
          {screen === 'settings' && <Settings settings={data.settings} />}
        </div>
      </main>
    </div>
  )
}
