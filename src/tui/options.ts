import { isRecord } from "../utils.js"

export type Options = {
  balanceRefreshMs: number
  showWhenEmpty: boolean
}

export const defaultBalanceRefreshMs = 600_000

export function parseOptions(value: unknown): Options {
  if (!isRecord(value)) {
    return {
      balanceRefreshMs: defaultBalanceRefreshMs,
      showWhenEmpty: true,
    }
  }

  return {
    balanceRefreshMs:
      typeof value.balanceRefreshMs === "number" && Number.isFinite(value.balanceRefreshMs)
        ? Math.max(60_000, value.balanceRefreshMs)
        : defaultBalanceRefreshMs,
    showWhenEmpty: typeof value.showWhenEmpty === "boolean" ? value.showWhenEmpty : true,
  }
}
