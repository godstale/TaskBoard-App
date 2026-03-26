import React, { useState, useEffect, useMemo } from 'react'
import type { Operation, AgentEvent, ClaudeEvent, GeminiSession, Workflow } from '@taskboard/core'
import { AllData } from '../useTaskBoard'
import { FlowFeed } from '../components/FlowFeed'

interface Props {
  data: AllData
  workflowFilter: string
  logs: { claudeLogs: string[], geminiLogs: string[] }
}

type Tab = 'feed' | 'stats' | 'claude' | 'gemini'

export function Monitoring({ data, workflowFilter, logs }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('feed')
  const [selectedClaudeLog, setSelectedClaudeLog] = useState<string | null>(logs.claudeLogs[0] || null)
  const [selectedGeminiLog, setSelectedGeminiLog] = useState<string | null>(logs.geminiLogs[0] || null)
  const [claudeEvents, setClaudeEvents] = useState<ClaudeEvent[]>([])
  const [geminiSession, setGeminiSession] = useState<GeminiSession | null>(null)

  const filteredOps = useMemo(() => {
    let ops = [...data.operations].sort((a, b) => b.id - a.id)
    if (workflowFilter !== 'all') {
      ops = ops.filter(o => o.workflow_id === workflowFilter)
    }
    return ops.slice(0, 50)
  }, [data.operations, workflowFilter])

  useEffect(() => {
    if (activeTab === 'claude' && selectedClaudeLog) {
      window.taskboard.getClaudeLog(selectedClaudeLog).then(setClaudeEvents)
    }
  }, [activeTab, selectedClaudeLog])

  useEffect(() => {
    if (activeTab === 'gemini' && selectedGeminiLog) {
      window.taskboard.getGeminiLog(selectedGeminiLog).then(setGeminiSession)
    }
  }, [activeTab, selectedGeminiLog])

  const toolStats = useMemo(() => {
    if (data.agentEvents.length === 0) return []
    const stats: Record<string, { count: number, totalMs: number, input: number, output: number }> = {}
    
    data.agentEvents.forEach(e => {
      if (e.event_type === 'tool_use' && e.tool_name) {
        if (!stats[e.tool_name]) {
          stats[e.tool_name] = { count: 0, totalMs: 0, input: 0, output: 0 }
        }
        stats[e.tool_name].count++
        stats[e.tool_name].totalMs += e.duration_ms || 0
        stats[e.tool_name].input += e.input_tokens || 0
        stats[e.tool_name].output += e.output_tokens || 0
      }
    })

    return Object.entries(stats)
      .map(([name, s]) => ({
        name,
        count: s.count,
        avgMs: s.totalMs / s.count,
        totalInput: s.input,
        totalOutput: s.output
      }))
      .sort((a, b) => b.count - a.count)
  }, [data.agentEvents])

  return (
    <div className="h-full flex flex-col bg-gray-950">
      <div className="flex border-b border-gray-800 bg-gray-900 px-4">
        {[
          { id: 'feed', label: 'Real-time Feed' },
          { id: 'stats', label: 'Tool Stats' },
          { id: 'claude', label: 'Claude Code Logs' },
          { id: 'gemini', label: 'Gemini CLI Logs' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4 flex flex-col">
        {activeTab === 'feed' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live Flow History
              </h3>
              <div className="text-[10px] text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">
                Showing {filteredOps.length} latest operations
              </div>
            </div>
            <div className="flex-1 min-h-[500px]">
              <FlowFeed operations={filteredOps} tasks={data.workflowOrder} />
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div>
             <h3 className="text-sm font-bold text-gray-400 mb-6">Tool Usage Statistics</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
               {toolStats.map(stat => (
                 <div key={stat.name} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                   <div className="text-lg font-bold text-white mb-4">{stat.name}</div>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Calls</div>
                       <div className="text-xl text-blue-400">{stat.count}</div>
                     </div>
                     <div>
                       <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Avg Latency</div>
                       <div className="text-xl text-green-400">{Math.round(stat.avgMs)}ms</div>
                     </div>
                     <div className="col-span-2">
                       <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Total Tokens</div>
                       <div className="text-sm text-gray-300">
                         In: {stat.totalInput.toLocaleString()} / Out: {stat.totalOutput.toLocaleString()}
                       </div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
             {toolStats.length === 0 && (
               <div className="text-center py-20 text-gray-600 italic">No tool usage data available.</div>
             )}
          </div>
        )}

        {activeTab === 'claude' && (
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <select 
                value={selectedClaudeLog || ''} 
                onChange={e => setSelectedClaudeLog(e.target.value)}
                className="bg-gray-900 border border-gray-800 text-sm text-gray-300 rounded px-3 py-1.5 outline-none w-full"
              >
                <option value="" disabled>Select a session log...</option>
                {logs.claudeLogs.map(log => (
                  <option key={log} value={log}>{log.split(/[/\\]/).pop()}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-2 font-mono text-[11px]">
              {claudeEvents.map((e, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 p-2 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`uppercase font-bold ${
                      e.type === 'tool_use' ? 'text-cyan-400' : 'text-purple-400'
                    }`}>{e.type}</span>
                    <span className="text-gray-600">{e.timestamp}</span>
                    {e.duration_ms && <span className="text-green-600 ml-auto">{e.duration_ms}ms</span>}
                  </div>
                  {e.type === 'tool_use' && (
                    <div className="text-gray-300">
                      <span className="text-blue-400 font-bold">{e.name}</span>
                      <pre className="mt-1 text-[10px] text-gray-500 overflow-x-auto">
                        {JSON.stringify(e.input, null, 2)}
                      </pre>
                    </div>
                  )}
                  {e.type === 'thinking' && (
                    <div className="text-gray-500 italic line-clamp-2">{e.thinking}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'gemini' && (
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <select 
                value={selectedGeminiLog || ''} 
                onChange={e => setSelectedGeminiLog(e.target.value)}
                className="bg-gray-900 border border-gray-800 text-sm text-gray-300 rounded px-3 py-1.5 outline-none w-full"
              >
                <option value="" disabled>Select a session log...</option>
                {logs.geminiLogs.map(log => (
                  <option key={log} value={log}>{log.split(/[/\\]/).pop()}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-4 font-mono text-[11px]">
              {geminiSession?.messages.map((msg, i) => (
                <div key={i} className={`p-3 rounded-lg border ${
                  msg.role === 'user' ? 'bg-gray-900 border-gray-800 ml-8' : 'bg-blue-900/10 border-blue-900/30 mr-8'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-bold uppercase ${
                      msg.role === 'user' ? 'text-gray-500' : 'text-blue-400'
                    }`}>{msg.role}</span>
                    <span className="text-gray-600 text-[10px]">{msg.timestamp}</span>
                    {msg.usageMetadata && (
                      <span className="text-[9px] text-gray-600 ml-auto">
                        Tokens: {msg.usageMetadata.totalTokenCount}
                      </span>
                    )}
                  </div>
                  {msg.parts.map((part, pi) => (
                    <div key={pi} className="mb-2">
                      {part.text && <div className="text-gray-300 whitespace-pre-wrap">{part.text}</div>}
                      {part.functionCall && (
                        <div className="mt-2 bg-black/30 p-2 rounded border border-blue-900/20">
                          <div className="text-cyan-400 font-bold mb-1">Call: {part.functionCall.name}</div>
                          <pre className="text-[10px] text-gray-500 overflow-x-auto">
                            {JSON.stringify(part.functionCall.args, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
