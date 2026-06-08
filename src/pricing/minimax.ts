import type { Price, ModelPriceEntry } from "./types.js"
import { minimaxM3TieredPrice, MINIMAX_M3_EXPENSIVE_CONTEXT_WARNING } from "./utils.js"

export const minimaxM3ShortContextDiscountPrice: Price = {
  cacheHitInput: 0.42,
  cacheMissInput: 2.1,
  output: 8.4,
  discounted: true,
  warnings: ["minimax-m3 上下文 <= 512K 当前按限时五折计价，特惠将于 2026-06-08 00:00:00 +08:00 结束"],
}

export const minimaxM3ShortContextPrice: Price = {
  cacheHitInput: 0.84,
  cacheMissInput: 4.2,
  output: 16.8,
  discounted: false,
}

export const minimaxM3LongContextPrice: Price = {
  cacheHitInput: 1.68,
  cacheMissInput: 8.4,
  output: 33.6,
  discounted: false,
  warnings: [MINIMAX_M3_EXPENSIVE_CONTEXT_WARNING],
}

export const MINIMAX_ENTRIES: readonly ModelPriceEntry[] = [
  {
    providerID: "minimax-cn",
    providerLabel: "MiniMax",
    modelID: "minimax-m3",
    modelLabel: "MiniMax-M3",
    priceFor: (time, inputTokens) => minimaxM3TieredPrice(time, inputTokens, minimaxM3ShortContextDiscountPrice, minimaxM3ShortContextPrice, minimaxM3LongContextPrice),
  },
]
