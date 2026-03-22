import React, { useMemo, useState } from 'react'
import type { EpicWithTasks, Task, TaskStatus } from '@taskboard/core'
import { AllData } from '../useTaskBoard'

interface Props {
  data: AllData
  workflowFilter: string
}

const STATUS_COLOR: Record<TaskStatus, string> = {
  done: 'bg-green-500',
  in_progress: 'bg-yellow-500',
  todo: 'bg-gray-500',
  interrupted: 'bg-red-500',
  cancelled: 'bg-gray-700',
}

const STATUS_TEXT: Record<TaskStatus, string> = {
  done: 'Done',
  in_progress: 'In Progress',
  todo: 'Todo',
  interrupted: 'Interrupted',
  cancelled: 'Cancelled',
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-700 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
    </div>
  )
}

function TaskDetails({ task }: { task: Task }) {
  if (!task.todo && !task.interrupt) return null
  return (
    <div className="mt-1 ml-10 space-y-1">
      {task.interrupt && (
        <div className="text-xs bg-red-900/30 text-red-300 p-2 rounded border border-red-800/50">
          <span className="font-semibold uppercase mr-2 text-[10px]">Interrupt:</span>
          {task.interrupt}
        </div>
      )}
      {task.todo && (
        <div className="text-xs bg-blue-900/20 text-blue-300 p-2 rounded border border-blue-800/30 italic">
          <span className="font-semibold uppercase mr-2 text-[10px]">Todo:</span>
          {task.todo}
        </div>
      )}
    </div>
  )
}

export function Dashboard({ data, workflowFilter }: Props) {
  const { project, epics: allEpics, objectives: allObjectives } = data

  const filteredEpics = useMemo(() => {
    if (workflowFilter === 'all') return allEpics
    return allEpics.filter(e => e.epic.workflow_id === workflowFilter)
  }, [allEpics, workflowFilter])

  const filteredObjectives = useMemo(() => {
    if (workflowFilter === 'all') return allObjectives
    return allObjectives.filter(o => o.workflow_id === workflowFilter)
  }, [allObjectives, workflowFilter])

  const allTasks = filteredEpics.flatMap(e => e.tasks.map(t => t.task))
  const doneTasks = allTasks.filter(t => t.status === 'done').length
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length

  return (
    <div className="p-6">
      {/* Header Stats */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{project?.title ?? 'Project'}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-400">
            <span><span className="text-white font-medium">{filteredEpics.length}</span> Epics</span>
            <span><span className="text-white font-medium">{allTasks.length}</span> Tasks</span>
            {filteredObjectives.length > 0 && (
              <span><span className="text-white font-medium">{filteredObjectives.length}</span> Objectives</span>
            )}
            <span><span className="text-green-400 font-medium">{doneTasks}</span> Done</span>
            <span><span className="text-yellow-400 font-medium">{inProgressTasks}</span> In Progress</span>
          </div>
        </div>
      </div>

      {/* Objectives Section */}
      {filteredObjectives.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-4 bg-purple-500 rounded-sm" />
            Objectives
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredObjectives.map(obj => (
              <div key={obj.id} className="bg-gray-900 border border-purple-900/30 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-purple-400 font-mono">{obj.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLOR[obj.status]} text-white uppercase`}>
                    {STATUS_TEXT[obj.status]}
                  </span>
                </div>
                <h3 className="text-white font-semibold mb-2">{obj.title}</h3>
                {obj.milestone_target && (
                  <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                    <span className="text-purple-400 italic">Target:</span> {obj.milestone_target}
                  </div>
                )}
                {obj.due_date && (
                  <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                    <span className="text-purple-400 italic">Due:</span> {obj.due_date}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Epic Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-2 h-4 bg-blue-500 rounded-sm" />
          Roadmap
        </h2>
        {filteredEpics.length === 0 ? (
          <div className="text-gray-500 italic text-sm py-4">No epics found for this filter.</div>
        ) : (
          filteredEpics.map(({ epic, tasks }) => {
            const epicDone = tasks.filter(t => t.task.status === 'done').length
            return (
              <div key={epic.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs text-gray-500 font-mono">{epic.id}</span>
                    <h3 className="text-white font-semibold">{epic.title}</h3>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[epic.status]} text-white`}>
                    {STATUS_TEXT[epic.status]}
                  </span>
                </div>
                <ProgressBar done={epicDone} total={tasks.length} />

                {/* Task list */}
                <div className="mt-3 space-y-2">
                  {tasks.map(({ task, children }) => (
                    <div key={task.id} className="group">
                      <div className="flex items-center gap-2 py-1">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLOR[task.status]}`} />
                        <span className="text-xs text-gray-500 font-mono w-20 flex-shrink-0">{task.id}</span>
                        <span className="text-sm text-gray-200 flex-1">{task.title}</span>
                        <span className="text-xs text-gray-500">{STATUS_TEXT[task.status]}</span>
                      </div>
                      <TaskDetails task={task} />
                      {children.map(child => (
                        <div key={child.id}>
                          <div className="flex items-center gap-2 py-1 pl-6">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_COLOR[child.status]}`} />
                            <span className="text-xs text-gray-500 font-mono w-20 flex-shrink-0">{child.id}</span>
                            <span className="text-sm text-gray-400 flex-1">{child.title}</span>
                            <span className="text-xs text-gray-500">{STATUS_TEXT[child.status]}</span>
                          </div>
                          <TaskDetails task={child} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
