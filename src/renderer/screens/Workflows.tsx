import React from 'react'
import type { Workflow } from '@taskboard/core'

interface Props {
  workflows: Workflow[]
}

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-green-900/30 text-green-400 border-green-800/50',
  completed: 'bg-blue-900/30 text-blue-400 border-blue-800/50',
  archived: 'bg-gray-800 text-gray-500 border-gray-700',
}

export function Workflows({ workflows }: Props) {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="w-2 h-6 bg-blue-500 rounded-sm" />
          Workflows
          <span className="text-gray-500 text-sm font-normal bg-gray-800 px-2 py-0.5 rounded-full ml-2">
            {workflows.length} total
          </span>
        </h2>
      </div>

      {workflows.length === 0 ? (
        <div className="text-gray-500 text-center py-20 bg-gray-900/50 border border-dashed border-gray-800 rounded-2xl">
          <div className="text-4xl mb-4 opacity-20">🔄</div>
          <p>No workflows defined in this project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map(wf => (
            <div 
              key={wf.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-500/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-500">{wf.id}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${STATUS_STYLE[wf.status] || STATUS_STYLE.archived}`}>
                      {wf.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                    {wf.title}
                  </h3>
                </div>
              </div>
              
              {wf.description ? (
                <p className="text-sm text-gray-400 mb-4 line-clamp-2 leading-relaxed italic">
                  {wf.description}
                </p>
              ) : (
                <p className="text-sm text-gray-600 mb-4 italic">No description provided.</p>
              )}

              <div className="flex flex-col gap-2 pt-4 border-t border-gray-800/50">
                {wf.source_file && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-bold uppercase tracking-tighter text-[9px] text-gray-600">Source</span>
                    <span className="font-mono truncate">{wf.source_file}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-bold uppercase tracking-tighter text-[9px] text-gray-600">Created</span>
                  <span>{wf.created_at}</span>
                </div>
                {wf.report && (
                  <div className="mt-2 p-3 bg-gray-950 rounded border border-gray-800/50 text-xs text-gray-400 line-clamp-3">
                    <span className="font-bold text-gray-600 uppercase text-[9px] block mb-1">Last Report</span>
                    {wf.report}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
