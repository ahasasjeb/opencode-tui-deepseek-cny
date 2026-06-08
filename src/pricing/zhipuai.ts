import type { Price, ModelPriceEntry } from "./types.js"
import { zhipuTieredPrice } from "./utils.js"

export const glm51ShortContextPrice: Price = {
  cacheHitInput: 1.3,
  cacheMissInput: 6,
  output: 24,
  discounted: false,
}

export const glm51LongContextPrice: Price = {
  cacheHitInput: 2,
  cacheMissInput: 8,
  output: 28,
  discounted: false,
}

export const glm5TurboShortContextPrice: Price = {
  cacheHitInput: 1.2,
  cacheMissInput: 5,
  output: 22,
  discounted: false,
}

export const glm5TurboLongContextPrice: Price = {
  cacheHitInput: 1.8,
  cacheMissInput: 7,
  output: 26,
  discounted: false,
}

export const glm5ShortContextPrice: Price = {
  cacheHitInput: 1,
  cacheMissInput: 4,
  output: 18,
  discounted: false,
}

export const glm5LongContextPrice: Price = {
  cacheHitInput: 1.5,
  cacheMissInput: 6,
  output: 22,
  discounted: false,
}

export const ZHIPUAI_ENTRIES: readonly ModelPriceEntry[] = [
  {
    providerID: "zhipuai",
    providerLabel: "ZhipuAI",
    modelID: "glm-5.1",
    modelLabel: "GLM-5.1",
    priceFor: (_time, inputTokens) => zhipuTieredPrice(inputTokens, glm51ShortContextPrice, glm51LongContextPrice),
  },
  {
    providerID: "zhipuai",
    providerLabel: "ZhipuAI",
    modelID: "glm-5-turbo",
    modelLabel: "GLM-5-Turbo",
    priceFor: (_time, inputTokens) =>
      zhipuTieredPrice(inputTokens, glm5TurboShortContextPrice, glm5TurboLongContextPrice),
  },
  {
    providerID: "zhipuai",
    providerLabel: "ZhipuAI",
    modelID: "glm-5",
    modelLabel: "GLM-5",
    priceFor: (_time, inputTokens) => zhipuTieredPrice(inputTokens, glm5ShortContextPrice, glm5LongContextPrice),
  },
]
