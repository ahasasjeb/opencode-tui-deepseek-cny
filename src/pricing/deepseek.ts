import type { Price, ModelPriceEntry } from "./types.js"

export const flashPrice: Price = {
  cacheHitInput: 0.02,
  cacheMissInput: 1,
  output: 2,
  discounted: false,
}

export const proPrice: Price = {
  cacheHitInput: 0.025,
  cacheMissInput: 3,
  output: 6,
  discounted: false,
}

export const DEEPSEEK_ENTRIES: readonly ModelPriceEntry[] = [
  {
    providerID: "deepseek",
    providerLabel: "DeepSeek",
    modelID: "deepseek-v4-flash",
    modelLabel: "V4 Flash",
    priceFor: () => flashPrice,
  },
  {
    providerID: "deepseek",
    providerLabel: "DeepSeek",
    modelID: "deepseek-v4-pro",
    modelLabel: "V4 Pro",
    priceFor: () => proPrice,
  },
]
