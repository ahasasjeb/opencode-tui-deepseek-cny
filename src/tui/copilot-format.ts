import type { QuotaSnapshot } from "../copilot-usage.js"
import { resolveDisplayPlan } from "../copilot-usage.js"

const QUOTA_LABELS: Record<string, string> = {
  "chat-requests": "Chat",
  "code-completions": "补全",
  "premium-chat-requests": "高级对话",
  chat: "Chat",
  completions: "补全",
  premium_interactions: "高级对话",
  premium_models: "高级模型",
}

const QUOTA_ORDER = ["chat", "chat-requests", "completions", "code-completions", "premium_interactions", "premium-chat-requests", "premium_models"]

export function quotaLabel(key: string): string {
  return QUOTA_LABELS[key] ?? key
}

export function quotaOrder(keys: string[]): string[] {
  const ordered = QUOTA_ORDER.filter((key) => keys.includes(key))
  const remaining = keys.filter((key) => !QUOTA_ORDER.includes(key))
  return [...ordered, ...remaining]
}

export function formatSnapshot(snapshot: QuotaSnapshot): string {
  if (snapshot.unlimited || snapshot.entitlement === -1 || (snapshot.entitlement === 0 && snapshot.unlimited)) {
    return "无限"
  }
  if (snapshot.entitlement === 0 && !snapshot.unlimited) {
    return "0"
  }
  const used = Math.max(0, snapshot.entitlement * (1 - snapshot.percentRemaining / 100))
  return `${Math.round(used)}/${snapshot.entitlement}`
}

export function formatResetDate(resetDate: string | null): string {
  if (!resetDate) return ""
  try {
    const date = new Date(resetDate.includes("T") ? resetDate : `${resetDate}T00:00:00Z`)
    const now = new Date()
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    if (isNaN(date.getTime())) return ""
    if (isToday) {
      return date.toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit" })
    }
    return date.toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  } catch {
    return ""
  }
}

export { resolveDisplayPlan }