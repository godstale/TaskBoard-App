import React, { useMemo, useState, useEffect, useRef } from 'react'
import type { Resource, Workflow } from '@taskboard/core'

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string; border: string }> = {
  input: { bg: 'bg-blue-900/20', text: 'text-blue-300', label: 'Input', border: 'border-blue-800/30' },
  output: { bg: 'bg-green-900/20', text: 'text-green-300', label: 'Output', border: 'border-green-800/30' },
  reference: { bg: 'bg-gray-800/50', text: 'text-gray-400', label: 'Reference', border: 'border-gray-700/50' },
  intermediate: { bg: 'bg-yellow-900/20', text: 'text-yellow-300', label: 'Intermediate', border: 'border-yellow-800/30' },
}

interface Props {
  resources: Resource[]
  workflows: Workflow[]
  workflowFilter: string
}

export function Resources({ resources, workflows, workflowFilter }: Props) {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, path: string } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const filteredResources = useMemo(() => {
    if (workflowFilter === 'all') return resources
    return resources.filter(r => r.workflow_id === workflowFilter)
  }, [resources, workflowFilter])

  const groupedResources = useMemo(() => {
    const groups: Record<string, Resource[]> = {}
    filteredResources.forEach(r => {
      const wid = r.workflow_id || 'unclassified'
      if (!groups[wid]) groups[wid] = []
      groups[wid].push(r)
    })
    return groups
  }, [filteredResources])

  const sortedGroupKeys = useMemo(() => {
    return Object.keys(groupedResources).sort((a, b) => {
      if (a === 'unclassified') return 1
      if (b === 'unclassified') return -1
      return a.localeCompare(b)
    })
  }, [groupedResources])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, path })
  }

  const handleOpenFolder = (path: string) => {
    window.taskboard.openInFolder(path)
    setContextMenu(null)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="w-2 h-6 bg-green-500 rounded-sm" />
          <span className="text-gray-400 text-sm font-medium">
            Showing <span className="text-white font-bold">{filteredResources.length}</span> recorded files
          </span>
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <div className="text-gray-500 text-center py-20 bg-gray-900/50 border border-dashed border-gray-800 rounded-2xl">
          <div className="text-4xl mb-4 opacity-20">📁</div>
          <p>No resources found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedGroupKeys.map(wid => {
            const workflow = workflows.find(w => w.id === wid)
            const groupResources = groupedResources[wid]
            
            return (
              <div key={wid} className="space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-800 pb-2">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    {wid === 'unclassified' ? 'Unclassified' : (workflow?.title || wid)}
                  </h3>
                  {wid !== 'unclassified' && (
                    <span className="text-[10px] font-mono text-gray-600 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">
                      {wid}
                    </span>
                  )}
                  <span className="ml-auto text-[10px] text-gray-600 font-bold uppercase">
                    {groupResources.length} Items
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {groupResources.map(r => {
                    const style = TYPE_STYLES[r.res_type] ?? TYPE_STYLES.reference
                    return (
                      <div
                        key={r.id}
                        onContextMenu={(e) => handleContextMenu(e, r.file_path)}
                        onClick={(e) => handleContextMenu(e, r.file_path)}
                        className={`${style.bg} ${style.border} border rounded-xl p-4 transition-all hover:bg-opacity-30 group cursor-pointer`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col gap-2 items-center flex-shrink-0 pt-0.5">
                            <span className={`${style.text} text-[10px] font-black w-20 text-center uppercase tracking-tighter bg-gray-950/50 px-2 py-1 rounded shadow-sm`}>
                              {style.label}
                            </span>
                            <span className="text-[9px] font-mono text-gray-600 font-bold uppercase">
                              {r.created_at.slice(11, 16)}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-mono text-gray-200 truncate group-hover:text-white transition-colors">
                              {r.file_path}
                            </div>
                            {r.description && (
                              <div className="text-xs text-gray-400 mt-1 italic leading-relaxed">
                                {r.description}
                              </div>
                            )}
                            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-800/30">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">Task</span>
                                <span className="text-[10px] font-mono text-gray-500 bg-gray-800/50 px-1.5 py-0.5 rounded">
                                  {r.task_id}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">Added</span>
                                <span className="text-[10px] text-gray-500">
                                  {r.created_at.split(' ')[0]}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div 
          ref={menuRef}
          className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1 min-w-[150px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button 
            onClick={() => handleOpenFolder(contextMenu.path)}
            className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-2"
          >
            <span>📂</span> 해당 위치 열기
          </button>
        </div>
      )}
    </div>
  )
}
