import type { Price, ModelPriceEntry } from "./types.js"
import { qwenPlusTieredPrice, QWEN_EXPENSIVE_CONTEXT_WARNING } from "./utils.js"

export const qwen37MaxDiscountPrice: Price = {
  cacheHitInput: 1.2,
  cacheMissInput: 6,
  output: 18,
  discounted: true,
  warnings: ["qwen3.7-max 当前按限时五折计价，官方暂未公布结束时间"],
}

export const qwen36PlusShortContextPrice: Price = {
  cacheHitInput: 2,
  cacheMissInput: 2,
  output: 12,
  discounted: false,
}

export const qwen36PlusLongContextPrice: Price = {
  cacheHitInput: 8,
  cacheMissInput: 8,
  output: 48,
  discounted: false,
  warnings: [QWEN_EXPENSIVE_CONTEXT_WARNING],
}

export const ALIBABA_ENTRIES: readonly ModelPriceEntry[] = [
  {
    providerID: "alibaba-cn",
    providerLabel: "Alibaba Cloud",
    modelID: "qwen3.7-max",
    modelLabel: "qwen3.7-max",
    priceFor: () => qwen37MaxDiscountPrice,
  },
  {
    providerID: "alibaba-cn",
    providerLabel: "Alibaba Cloud",
    modelID: "qwen3.6-plus",
    modelLabel: "qwen3.6-plus",
    priceFor: (_time, inputTokens) => qwenPlusTieredPrice(inputTokens, qwen36PlusShortContextPrice, qwen36PlusLongContextPrice),
  },
]
