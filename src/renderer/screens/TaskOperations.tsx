import React, { useMemo, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MarkerType,
  NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { Task, Operation, Workflow } from '@taskboard/core'
import { AllData } from '../useTaskBoard'

interface Props {
  data: AllData
  selectedTaskId: string | null
  onSelectTask: (id: string | null) => void
  workflowFilter: string
}

const OP_COLOR: Record<string, string> = {
  start: '#06b6d4',
  progress: '#6b7280',
  complete: '#22c55e',
  error: '#ef4444',
  interrupt: '#f59e0b',
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

function formatTokens(n: number): string {
  return n.toLocaleString()
}

interface OpNodeData {
  operationType: string
  color: string
  time: string
  agent?: string
  summary?: string
  toolName?: string
  skillName?: string
  mcpName?: string
  retryCount?: number
  inputTokens?: number
  outputTokens?: number
  durationSeconds?: number
}

function OperationNode({ data }: { data: OpNodeData }) {
  const hasV2 = data.toolName != null || data.skillName != null || data.mcpName != null ||
    data.inputTokens != null || data.outputTokens != null ||
    data.durationSeconds != null || (data.retryCount ?? 0) > 0

  return (
    <div
      className="bg-gray-800 border rounded-lg px-4 py-2 min-w-56"
      style={{ borderColor: data.color }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: data.color }}
        />
        <span className="text-xs font-medium text-white uppercase tracking-wide">
          {data.operationType}
        </span>
        <span className="text-xs text-gray-500 ml-auto">{data.time}</span>
      </div>
      {data.agent && (
        <div className="text-xs text-blue-400">{data.agent}</div>
      )}
      {data.summary && (
        <div className="text-xs text-gray-300 mt-1 line-clamp-3">{data.summary}</div>
      )}
      {hasV2 && (
        <div className="border-t border-gray-600 mt-2 pt-2">
          {(data.toolName || data.skillName || data.mcpName) && (
            <div className="flex flex-wrap gap-1 mb-1">
              {data.toolName && (
                <span className="text-xs bg-cyan-900 text-cyan-300 px-1.5 py-0.5 rounded">
                  {data.toolName}
                </span>
              )}
              {data.skillName && (
                <span className="text-xs bg-purple-900 text-purple-300 px-1.5 py-0.5 rounded">
                  {data.skillName}
                </span>
              )}
              {data.mcpName && (
                <span className="text-xs bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded">
                  {data.mcpName}
                </span>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-400">
            {(data.inputTokens != null || data.outputTokens != null) && (
              <span>
                <span className="text-green-400">in:{formatTokens(data.inputTokens ?? 0)}</span>
                {' / '}
                <span className="text-yellow-400">out:{formatTokens(data.outputTokens ?? 0)}</span>
              </span>
            )}
            {data.durationSeconds != null && (
              <span>{formatDuration(data.durationSeconds)}</span>
            )}
            {(data.retryCount ?? 0) > 0 && (
              <span className="text-red-400">×{data.retryCount}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const nodeTypes: NodeTypes = { operation: OperationNode }

export function TaskOperations({ data, selectedTaskId, onSelectTask, workflowFilter }: Props) {
  const allTasks = useMemo(() => {
    const tasks = data.epics.flatMap(e => [
      ...e.tasks.map(t => t.task),
      ...e.tasks.flatMap(t => t.children)
    ])
    return [...tasks, ...data.objectives]
  }, [data.epics, data.objectives])

  const filteredTasks = useMemo(() => {
    if (workflowFilter === 'all') return allTasks
    return allTasks.filter(t => t.workflow_id === workflowFilter)
  }, [allTasks, workflowFilter])

  const selectedTask = useMemo(() => {
    return selectedTaskId
      ? allTasks.find(t => t.id === selectedTaskId)
      : filteredTasks[0] ?? null
  }, [selectedTaskId, allTasks, filteredTasks])

  const taskOps = useMemo(() => {
    if (!selectedTask) return []
    return data.operations.filter(o => o.task_id === selectedTask.id)
  }, [data.operations, selectedTask?.id])

  // Summary stats
  const totalInputTokens = taskOps.reduce((sum, op) => sum + (op.input_tokens ?? 0), 0)
  const totalOutputTokens = taskOps.reduce((sum, op) => sum + (op.output_tokens ?? 0), 0)
  const totalDuration = taskOps.reduce((sum, op) => sum + (op.duration_seconds ?? 0), 0)
  const hasTokenData = taskOps.some(op => op.input_tokens != null || op.output_tokens != null)

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = taskOps.map((op, i) => ({
      id: String(op.id),
      type: 'operation',
      position: { x: 100, y: i * 140 },
      data: {
        operationType: op.operation_type,
        color: OP_COLOR[op.operation_type] ?? '#6b7280',
        time: op.created_at?.slice(11, 16) ?? '',
        agent: op.agent_platform,
        summary: op.summary,
        toolName: op.tool_name,
        skillName: op.skill_name,
        mcpName: op.mcp_name,
        retryCount: op.retry_count,
        inputTokens: op.input_tokens,
        outputTokens: op.output_tokens,
        durationSeconds: op.duration_seconds,
      } satisfies OpNodeData,
    }))

    const edges: Edge[] = taskOps.slice(0, -1).map((op, i) => ({
      id: `e${op.id}-${taskOps[i + 1].id}`,
      source: String(op.id),
      target: String(taskOps[i + 1].id),
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#374151' },
    }))

    return { nodes, edges }
  }, [taskOps])

  return (
    <div className="h-full flex flex-col">
      {/* Task Header info */}
      <div className="px-4 py-2 border-b border-gray-800 bg-gray-900 flex items-center min-h-[40px]">
        {selectedTask && (
          <div className="flex items-center gap-2 text-sm flex-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
              selectedTask.type === 'objective' ? 'bg-purple-900 text-purple-300' :
              selectedTask.type === 'epic' ? 'bg-blue-900 text-blue-300' :
              'bg-gray-800 text-gray-400'
            }`}>
              {selectedTask.type}
            </span>
            <span className="text-white font-medium truncate">
              [{selectedTask.id}] {selectedTask.title}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase ${
              selectedTask.status === 'done' ? 'bg-green-900 text-green-300' :
              selectedTask.status === 'in_progress' ? 'bg-yellow-900 text-yellow-300' :
              'bg-gray-800 text-gray-400'
            }`}>
              {selectedTask.status}
            </span>
            {hasTokenData && (
              <span className="ml-auto text-xs text-gray-500 flex items-center gap-3">
                <span className="flex items-center gap-2">
                  <span className="text-green-400">IN:{formatTokens(totalInputTokens)}</span>
                  <span className="text-yellow-400">OUT:{formatTokens(totalOutputTokens)}</span>
                </span>
                {totalDuration > 0 && (
                  <span className="border-l border-gray-700 pl-3">{formatDuration(totalDuration)}</span>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Task selector sidebar */}
        <div className="w-64 border-r border-gray-800 overflow-y-auto bg-gray-900 flex-shrink-0">
          <div className="p-3">
            <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 font-bold">ETS Components</h3>
            <div className="space-y-1">
              {filteredTasks.map(t => (
                <button
                  key={t.id}
                  onClick={() => onSelectTask(t.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all group ${
                    t.id === selectedTask?.id
                      ? 'bg-blue-600 shadow-lg shadow-blue-900/20'
                      : 'hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      t.status === 'done' ? 'bg-green-500' :
                      t.status === 'in_progress' ? 'bg-yellow-500' :
                      t.status === 'interrupted' ? 'bg-red-500' :
                      'bg-gray-600'
                    }`} />
                    <span className={`text-[10px] font-mono ${t.id === selectedTask?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                      {t.id}
                    </span>
                    <span className={`ml-auto text-[9px] uppercase font-bold tracking-tighter ${
                      t.type === 'objective' ? 'text-purple-400' :
                      t.type === 'epic' ? 'text-blue-400' :
                      'text-gray-600'
                    }`}>
                      {t.type[0]}
                    </span>
                  </div>
                  <div className={`text-xs truncate ${t.id === selectedTask?.id ? 'text-white font-medium' : 'text-gray-400 group-hover:text-gray-200'}`}>
                    {t.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ReactFlow canvas */}
        <div className="flex-1 bg-gray-950">
          {!selectedTask ? (
            <div className="h-full flex items-center justify-center text-gray-600 flex-col gap-2">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-800 flex items-center justify-center text-xl">?</div>
              <p className="text-sm">Select a task or objective to view its operation history</p>
            </div>
          ) : taskOps.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-600">
              <p className="text-sm italic">No operations recorded for this item.</p>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <Background color="#111827" gap={20} />
              <Controls className="bg-gray-800 border-gray-700 fill-white" />
            </ReactFlow>
          )}
        </div>
      </div>
    </div>
  )
}
