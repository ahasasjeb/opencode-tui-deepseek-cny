import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import { RGBA } from "@opentui/core"
import type { DisplayBalance } from "../balance.js"
import { BALANCE_TRACKED_PROVIDERS, TRACKED_PROVIDERS, type BalanceProviderID } from "../pricing.js"

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

export type BalanceStateMap = Partial<Record<BalanceProviderID, BalanceState>>
export type TrackedProvider = (typeof TRACKED_PROVIDERS)[number]

const orange = RGBA.fromInts(255, 135, 0)

const LOW_BALANCE_CNY = 3
const HIGH_BALANCE_CNY = 9

export function balanceTone(theme: TuiPluginApi["theme"]["current"], amount: number | undefined) {
  if (amount === undefined) return theme.success
  if (amount <= 0) return theme.error
  if (amount <= LOW_BALANCE_CNY) return orange
  if (amount <= HIGH_BALANCE_CNY) return theme.warning
  return theme.success
}

export function tokenSignature(tokens: Partial<Record<BalanceProviderID, string>>) {
  return BALANCE_TRACKED_PROVIDERS.map((provider) => `${provider.id}:${tokens[provider.id] ?? ""}`).join("|")
}
