import React, { useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MarkerType,
  NodeTypes,
  Handle,
  Position,
  ConnectionLineType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { Operation, Task } from '@taskboard/core'

const OP_COLOR: Record<string, string> = {
  start: '#3b82f6',
  progress: '#6b7280',
  complete: '#22c55e',
  error: '#ef4444',
  interrupt: '#f59e0b',
}

const TASK_WIDTH = 300 // Width of one operation node
const TASK_SPACING = 100 // Spacing between operation nodes
const ROW_HEIGHT = 450 // Vertical distance between generations
const COL_SPACING = 150 // Horizontal spacing between task boxes in a generation

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

interface OpNodeData {
  operationType: string
  color: string
  time: string
  taskId: string
  summary?: string
  toolName?: string
  durationSeconds?: number
}

function OperationNode({ data }: { data: OpNodeData }) {
  return (
    <div
      className="bg-gray-900 border-2 rounded-xl px-4 py-3 w-[280px] shadow-2xl transition-all hover:scale-105"
      style={{ borderColor: data.color }}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-gray-600 border-none" />
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: data.color }}
        />
        <span className="text-[11px] font-black text-white uppercase tracking-wider">
          {data.operationType}
        </span>
        <span className="text-[10px] text-gray-500 font-mono ml-auto bg-black/30 px-1.5 py-0.5 rounded">
          {data.time}
        </span>
      </div>
      <div className="text-[10px] text-blue-400 font-mono mb-2 truncate bg-blue-900/10 px-1.5 py-0.5 rounded border border-blue-900/20">
        {data.taskId}
      </div>
      {data.summary && (
        <div className="text-[12px] text-gray-300 line-clamp-2 leading-snug mb-2 min-h-[2.5em]">
          {data.summary}
        </div>
      )}
      {data.toolName && (
        <div className="mt-2 pt-2 border-t border-gray-800 flex items-center justify-between">
          <span className="text-[10px] bg-cyan-900/30 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/50 font-mono">
            {data.toolName}
          </span>
          {data.durationSeconds != null && (
             <span className="text-[10px] text-gray-500 font-medium">
               {formatDuration(data.durationSeconds)}
             </span>
          )}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-gray-600 border-none" />
    </div>
  )
}

function TaskBoxNode({ data }: { data: { title: string, width: number, height: number } }) {
  return (
    <div 
      className="bg-blue-900/5 border border-blue-500/20 rounded-3xl pointer-events-none flex flex-col overflow-hidden"
      style={{ width: data.width, height: data.height }}
    >
      <div className="px-6 py-3 border-b border-blue-500/10 bg-blue-500/10 backdrop-blur-sm">
        <span className="text-[12px] text-blue-400 font-black uppercase tracking-[0.2em] line-clamp-1">{data.title}</span>
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = { 
  operation: OperationNode,
  taskBox: TaskBoxNode
}

interface Props {
  operations: Operation[]
  tasks: Task[]
}

export function FlowFeed({ operations, tasks }: Props) {
  const taskMap = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks])

  const sortedOps = useMemo(() => {
    return [...operations].sort((a, b) => {
      const timeA = new Date(a.created_at).getTime()
      const timeB = new Date(b.created_at).getTime()
      if (timeA !== timeB) return timeA - timeB
      return a.id - b.id
    })
  }, [operations])

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []
    
    // 1. Group operations by task
    const taskGroups: Map<string, Operation[]> = new Map()
    const taskTimeRange: Map<string, { start: number, end: number }> = new Map()

    sortedOps.forEach(op => {
      if (!taskGroups.has(op.task_id)) taskGroups.set(op.task_id, [])
      taskGroups.get(op.task_id)!.push(op)
      
      const time = new Date(op.created_at).getTime()
      const range = taskTimeRange.get(op.task_id) || { start: Infinity, end: -Infinity }
      range.start = Math.min(range.start, time)
      range.end = Math.max(range.end, time)
      taskTimeRange.set(op.task_id, range)
    })

    // 2. Identify Generations (Rows) based on parallelism
    const sortedTaskIds = Array.from(taskGroups.keys()).sort((a, b) => 
      taskTimeRange.get(a)!.start - taskTimeRange.get(b)!.start
    )

    const generations: string[][] = []
    sortedTaskIds.forEach(taskId => {
      const start = taskTimeRange.get(taskId)!.start
      
      // Try to find a generation where this task overlaps with EVERY task in the generation.
      // This ensures that if any task in the generation has already finished
      // before this task starts, it is not considered parallel and starts a new generation (row).
      let added = false
      for (const gen of generations) {
        const allOverlap = gen.every(id => {
          const gRange = taskTimeRange.get(id)!
          // Since sortedTaskIds are sorted by start time, we know start >= gRange.start.
          // We only need to check if it starts before the existing tasks finish.
          return start < gRange.end
        })
        
        if (allOverlap) {
          gen.push(taskId)
          added = true
          break
        }
      }
      
      if (!added) {
        generations.push([taskId])
      }
    })

    // 3. Layout and Connections
    const lastOpsOfGeneration = new Map<number, string[]>() // Generation Index -> Node IDs

    generations.forEach((genTaskIds, genIndex) => {
      const taskY = genIndex * ROW_HEIGHT
      const genLastOps: string[] = []
      
      let currentXOffset = 0
      
      genTaskIds.forEach((taskId, taskInGenIndex) => {
        const ops = taskGroups.get(taskId)!
        const taskTitle = taskMap.get(taskId)?.title || taskId
        const boxWidth = ops.length * (TASK_WIDTH + 50) + 50
        
        const taskBaseX = currentXOffset
        
        // Add Task Box
        nodes.push({
          id: `task-box-${taskId}`,
          type: 'taskBox',
          position: { x: taskBaseX - 25, y: taskY - 60 },
          data: { title: taskTitle, width: boxWidth, height: 260 },
          zIndex: -1,
          selectable: false,
          draggable: false,
        })

        let lastNodeIdInTask: string | null = null

        ops.forEach((op, opIndex) => {
          const nodeId = `op-${op.id}`
          const nodeX = taskBaseX + opIndex * (TASK_WIDTH + 50)

          nodes.push({
            id: nodeId,
            type: 'operation',
            position: { x: nodeX, y: taskY },
            data: {
              operationType: op.operation_type,
              color: OP_COLOR[op.operation_type] ?? '#6b7280',
              time: op.created_at?.slice(11, 19) ?? '',
              taskId: op.task_id,
              summary: op.summary,
              toolName: op.tool_name,
              durationSeconds: op.duration_seconds,
            } satisfies OpNodeData,
          })

          // Internal connections
          if (opIndex > 0) {
            const prevNodeId = `op-${ops[opIndex - 1].id}`
            edges.push({
              id: `edge-int-${prevNodeId}-${nodeId}`,
              source: prevNodeId,
              target: nodeId,
              type: ConnectionLineType.SmoothStep,
              markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' },
              style: { stroke: '#4b5563', strokeWidth: 2, opacity: 0.8 },
            })
          } else {
            // First operation of a task: Divergence (Branching)
            if (genIndex > 0) {
              const prevGenOps = lastOpsOfGeneration.get(genIndex - 1) || []
              prevGenOps.forEach(prevOpId => {
                edges.push({
                  id: `edge-div-${prevOpId}-${nodeId}`,
                  source: prevOpId,
                  target: nodeId,
                  type: ConnectionLineType.SmoothStep,
                  markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
                  style: { stroke: '#3b82f6', strokeWidth: 2, opacity: 0.4 },
                })
              })
            }
          }
          
          lastNodeIdInTask = nodeId
        })

        if (lastNodeIdInTask) genLastOps.push(lastNodeIdInTask)
        
        currentXOffset += boxWidth + COL_SPACING
      })
      
      lastOpsOfGeneration.set(genIndex, genLastOps)
    })

    return { nodes, edges }
  }, [sortedOps, taskMap])

  return (
    <div className="h-full w-full bg-gray-950 rounded-xl border border-gray-800 overflow-hidden relative shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.05}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
      >
        <Background color="#111827" gap={40} size={1} />
        <Controls className="bg-gray-800 border-gray-700 fill-white" />
      </ReactFlow>
      
      {/* Legend */}
      <div className="absolute top-6 left-6 flex flex-col gap-3 z-10 bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-gray-700/50 shadow-2xl">
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Status Colors</div>
        <div className="flex gap-4">
          {Object.entries(OP_COLOR).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
