import fs from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'
import readline from 'readline'
import type { ClaudeEvent, GeminiSession } from './models'

/**
 * Claude Code 세션 디렉토리를 찾습니다.
 */
export function findClaudeProjectDir(projectAbsPath: string): string | null {
  const claudeBase = path.join(os.homedir(), '.claude', 'projects')
  if (!fs.existsSync(claudeBase)) return null

  try {
    const hashDirs = fs.readdirSync(claudeBase)
    for (const hashDir of hashDirs) {
      const indexPath = path.join(claudeBase, hashDir, 'sessions-index.json')
      if (!fs.existsSync(indexPath)) continue
      
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
      const entries = Array.isArray(index) ? index : Object.values(index)
      const match = entries.some((e: any) => 
        e?.cwd === projectAbsPath || e?.projectPath === projectAbsPath
      )
      if (match) return path.join(claudeBase, hashDir)
    }
  } catch (err) {
    console.error('Error finding Claude project dir:', err)
  }
  return null
}

/**
 * Gemini CLI 세션 디렉토리를 찾습니다.
 */
export function findGeminiProjectDir(projectAbsPath: string): string | null {
  // Gemini CLI는 프로젝트 경로의 SHA-256 해시를 사용함
  const hash = crypto.createHash('sha256').update(projectAbsPath).digest('hex')
  const geminiBase = path.join(os.homedir(), '.gemini', 'tmp', hash, 'chats')
  if (fs.existsSync(geminiBase)) return geminiBase
  return null
}

/**
 * Claude Code JSONL 로그를 파싱합니다.
 */
export async function parseClaudeLog(filePath: string): Promise<ClaudeEvent[]> {
  const events: ClaudeEvent[] = []
  const toolUseMap = new Map<string, ClaudeEvent>()

  if (!fs.existsSync(filePath)) return []

  const fileStream = fs.createReadStream(filePath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  for await (const line of rl) {
    if (!line.trim()) continue
    try {
      const event = JSON.parse(line) as ClaudeEvent
      if (event.type === 'tool_use' && event.id) {
        toolUseMap.set(event.id, event)
        events.push({ ...event, duration_ms: undefined })
      } else if (event.type === 'tool_result' && event.tool_use_id) {
        const use = toolUseMap.get(event.tool_use_id)
        if (use) {
          const duration = new Date(event.timestamp).getTime() - new Date(use.timestamp).getTime()
          const idx = events.findIndex(e => e.id === use.id)
          if (idx >= 0) events[idx].duration_ms = duration
        }
      } else if (event.type === 'thinking') {
        events.push(event)
      }
    } catch (err) {
      // skip malformed lines
    }
  }

  return events
}

/**
 * Gemini CLI JSON 로그를 파싱합니다.
 */
export function parseGeminiLog(filePath: string): GeminiSession | null {
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as GeminiSession
  } catch {
    return null
  }
}
