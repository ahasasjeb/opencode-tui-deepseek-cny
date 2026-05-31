import { isRecord } from "./utils.js"

export const USD_CNY_RATE_URL = "https://huilv.lzy1.fun/api/huilv"

export type ExchangeRateResult =
  | {
      ok: true
      rate: number
      updatedAt?: string
    }
  | {
      ok: false
      message: string
    }

type FetchLike = (input: string, init?: { signal?: AbortSignal }) => Promise<{
  ok: boolean
  status: number
  text: () => Promise<string>
}>

export async function fetchUsdCnyRate(signal?: AbortSignal, fetchFn: FetchLike = fetch): Promise<ExchangeRateResult> {
  const response = await fetchFn(USD_CNY_RATE_URL, { signal })
  if (!response.ok) return { ok: false, message: `汇率接口 HTTP ${response.status}` }
  return parseUsdCnyRate(await response.text())
}

export function parseUsdCnyRate(input: unknown): ExchangeRateResult {
  const data = normalizeRatePayload(input)
  const item = Array.isArray(data) ? data[0] : data
  if (!isRecord(item)) return { ok: false, message: "汇率接口格式未知" }

  const code = readNumber(item.code)
  if (code !== undefined && code !== 200) return { ok: false, message: `汇率接口返回 code ${code}` }
  if (readString(item.from) !== "USD" || readString(item.to) !== "CNY") {
    return { ok: false, message: "汇率接口不是 USD/CNY" }
  }

  const rate = readNumber(item.rate) ?? readNumber(item.result)
  if (rate === undefined || rate <= 0) return { ok: false, message: "汇率接口缺少有效 rate" }

  return {
    ok: true,
    rate,
    updatedAt: readString(item.uptime),
  }
}

function normalizeRatePayload(input: unknown) {
  if (typeof input !== "string") return input
  const text = input.trim()
  const parsed = tryParseJson(text)
  if (parsed !== undefined) return parsed

  const objectStart = text.indexOf("{")
  const objectEnd = text.lastIndexOf("}")
  if (objectStart >= 0 && objectEnd > objectStart) {
    return tryParseJson(text.slice(objectStart, objectEnd + 1))
  }

  return undefined
}

function tryParseJson(text: string) {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

function readNumber(value: unknown) {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN
  return Number.isFinite(number) ? number : undefined
}

function readString(value: unknown) {
  return typeof value === "string" ? value : undefined
}
