import type { DisplayBalance } from "../balance.js"

const money = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

export function formatMoney(value: number) {
  return money.format(value)
}

export function formatTokens(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString("zh-CN")
}

export function formatTime(value: number) {
  return new Date(value).toLocaleTimeString("zh-CN", {
    hour12: false,
  })
}

export function formatDetails(details: DisplayBalance["details"]) {
  return details.map((item) => `${item.label} ${item.value}`).join(" · ")
}

export function errorMessage(cause: unknown) {
  if (cause instanceof Error) return cause.message
  return String(cause)
}
