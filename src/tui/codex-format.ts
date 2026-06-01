import type { WindowLimit } from "../codex-usage.js"

export function formatWindowLabel(limit: WindowLimit): string {
  const seconds = limit.windowSeconds
  if (seconds >= 2592000 && seconds % 2592000 === 0) return `${seconds / 2592000} 个月限额`
  if (seconds >= 86400 && seconds % 86400 === 0) return `${seconds / 86400} 天限额`
  if (seconds >= 3600 && seconds % 3600 === 0) return `${seconds / 3600} 小时限额`
  if (seconds >= 60) return `${Math.round(seconds / 60)} 分钟限额`
  return "使用限额"
}
