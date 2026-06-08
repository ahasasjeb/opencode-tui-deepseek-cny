import type { Price, ModelPriceEntry } from "./types.js"
import { hy3PreviewTieredPrice } from "./utils.js"

export const hy3PreviewShortContextPrice: Price = {
  cacheHitInput: 0.4,
  cacheMissInput: 1.2,
  output: 4,
  discounted: false,
}

export const hy3PreviewMediumContextPrice: Price = {
  cacheHitInput: 0.6,
  cacheMissInput: 1.6,
  output: 6.4,
  discounted: false,
}

export const hy3PreviewLongContextPrice: Price = {
  cacheHitInput: 0.8,
  cacheMissInput: 2,
  output: 8,
  discounted: false,
}

export const TENCENT_ENTRIES: readonly ModelPriceEntry[] = [
  {
    providerID: "tencent-tokenhub",
    providerLabel: "Tencent TokenHub",
    modelID: "hy3-preview",
    modelLabel: "Hy3 Preview",
    priceFor: (_time, inputTokens) => hy3PreviewTieredPrice(inputTokens, hy3PreviewShortContextPrice, hy3PreviewMediumContextPrice, hy3PreviewLongContextPrice),
  },
]
