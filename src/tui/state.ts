import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import { RGBA } from "@opentui/core"
import type { DisplayBalance } from "../balance.js"
import { TRACKED_PROVIDERS, type TrackedProviderID } from "../pricing.js"

export type BalanceState =
  | {
    status: "idle" | "loading" | "missing"
  }
  | {
    status: "ready"
    balance: DisplayBalance
    updatedAt: number
  }
  | {
    status: "error"
    message: string
  }

export type BalanceStateMap = Partial<Record<TrackedProviderID, BalanceState>>
export type TrackedProvider = (typeof TRACKED_PROVIDERS)[number]

const orange = RGBA.fromInts(255, 135, 0)

export function balanceTone(theme: TuiPluginApi["theme"]["current"], amount: number | undefined) {
  if (amount === undefined) return theme.success
  if (amount <= 0) return theme.error
  if (amount <= 3) return orange
  if (amount <= 9) return theme.warning
  return theme.success
}

export function tokenSignature(tokens: Partial<Record<TrackedProviderID, string>>) {
  return TRACKED_PROVIDERS.map((provider) => `${provider.id}:${tokens[provider.id] ?? ""}`).join("|")
}
