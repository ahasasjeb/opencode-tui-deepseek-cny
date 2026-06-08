import type { Price, ModelPriceEntry } from "./types.js"
import { minimaxM3TieredPrice, MINIMAX_M3_EXPENSIVE_CONTEXT_WARNING } from "./utils.js"

export const minimaxM3ShortContextPrice: Price = {
  cacheHitInput: 0.42,
  cacheMissInput: 2.1,
  output: 8.4,
  discounted: false,
}

export const minimaxM3MediumContextPrice: Price = {
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
    priceFor: (_time, inputTokens) => minimaxM3TieredPrice(inputTokens, minimaxM3ShortContextPrice, minimaxM3MediumContextPrice, minimaxM3LongContextPrice),
  },
]
