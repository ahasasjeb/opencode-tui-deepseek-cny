import type { Price, PricingOptions } from "./types.js"

export const ZHIPU_CONTEXT_TIER_THRESHOLD_TOKENS = 32_000
export const QWEN_PLUS_CONTEXT_TIER_THRESHOLD_TOKENS = 256_000
export const MINIMAX_M3_CONTEXT_TIER_THRESHOLD_TOKENS = 512_000
export const MINIMAX_M3_MEDIUM_CONTEXT_THRESHOLD_TOKENS = 1_000_000
export const OPENAI_LONG_CONTEXT_THRESHOLD_TOKENS = 272_000
export const HY3_PREVIEW_SHORT_CONTEXT_THRESHOLD_TOKENS = 16_000
export const HY3_PREVIEW_MEDIUM_CONTEXT_THRESHOLD_TOKENS = 32_000
export const QWEN_EXPENSIVE_CONTEXT_WARNING = "qwen3.6-plus 价格高昂警告"
export const MINIMAX_M3_EXPENSIVE_CONTEXT_WARNING = "minimax-m3 512K 到 1M 价格高昂警告"
export const NO_CACHE_AFTER_MULTI_TURN_WARNING = "多轮对话缓存命中为 0，请注意价格"
export const USD_CNY_RATE_PENDING_WARNING = "正在获取美元兑人民币汇率，成功后自动换算人民币价格"

export function safe(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, value)
}

export function unique(values: readonly string[]) {
  return [...new Set(values)]
}

export function roundMoney(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000
}

export function zhipuTieredPrice(inputTokens: number, shortContextPrice: Price, longContextPrice: Price) {
  return inputTokens < ZHIPU_CONTEXT_TIER_THRESHOLD_TOKENS ? shortContextPrice : longContextPrice
}

export function qwenPlusTieredPrice(inputTokens: number, shortPrice: Price, longPrice: Price) {
  return inputTokens <= QWEN_PLUS_CONTEXT_TIER_THRESHOLD_TOKENS ? shortPrice : longPrice
}

export function minimaxM3TieredPrice(
  inputTokens: number,
  shortPrice: Price,
  mediumPrice: Price,
  longPrice: Price,
) {
  if (inputTokens > MINIMAX_M3_MEDIUM_CONTEXT_THRESHOLD_TOKENS) return longPrice
  if (inputTokens > MINIMAX_M3_CONTEXT_TIER_THRESHOLD_TOKENS) return mediumPrice
  return shortPrice
}

export function hy3PreviewTieredPrice(
  inputTokens: number,
  shortPrice: Price,
  mediumPrice: Price,
  longPrice: Price,
) {
  if (inputTokens < HY3_PREVIEW_SHORT_CONTEXT_THRESHOLD_TOKENS) return shortPrice
  if (inputTokens < HY3_PREVIEW_MEDIUM_CONTEXT_THRESHOLD_TOKENS) return mediumPrice
  return longPrice
}

export function openAILongContextPrice(
  inputTokens: number,
  options: PricingOptions,
  price: Omit<Price, "discounted" | "warnings">,
) {
  if (inputTokens <= OPENAI_LONG_CONTEXT_THRESHOLD_TOKENS) return usdPrice(options.usdCnyRate, price)
  return usdPrice(options.usdCnyRate, {
    cacheHitInput: price.cacheHitInput * 2,
    cacheMissInput: price.cacheMissInput * 2,
    output: price.output * 1.5,
  })
}

export function opencodeTieredPrice(
  inputTokens: number,
  options: PricingOptions,
  short: Omit<Price, "discounted" | "warnings">,
  long: Omit<Price, "discounted" | "warnings">,
  threshold: number,
): Price {
  return inputTokens <= threshold ? usdPrice(options.usdCnyRate, short) : usdPrice(options.usdCnyRate, long)
}

export function usdPrice(rate: number | undefined, price: Omit<Price, "discounted" | "warnings">): Price {
  if (!Number.isFinite(rate) || rate === undefined || rate <= 0) {
    return {
      cacheHitInput: 0,
      cacheMissInput: 0,
      output: 0,
      discounted: false,
      warnings: [USD_CNY_RATE_PENDING_WARNING],
    }
  }

  const cacheWriteInput = price.cacheWriteInput !== undefined ? roundMoney(price.cacheWriteInput * rate) : undefined
  const cacheWrite1hInput = price.cacheWrite1hInput !== undefined ? roundMoney(price.cacheWrite1hInput * rate) : undefined
  return {
    cacheHitInput: roundMoney(price.cacheHitInput * rate),
    cacheMissInput: roundMoney(price.cacheMissInput * rate),
    cacheWriteInput,
    cacheWrite1hInput,
    output: roundMoney(price.output * rate),
    discounted: false,
  }
}
