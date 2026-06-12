import type { Price, ModelPriceEntry } from "./types.js"

export const kimiK25Price: Price = {
  cacheHitInput: 0.7,
  cacheMissInput: 4,
  output: 21,
  discounted: false,
}

export const kimiK26Price: Price = {
  cacheHitInput: 1.1,
  cacheMissInput: 6.5,
  output: 27,
  discounted: false,
}
//kimi-k2.7-code
export const kimiK27CodePrice: Price = {
  cacheHitInput: 1.3,
  cacheMissInput: 6.5,
  output: 27,
  discounted: false,
}
export const KIMI_ENTRIES: readonly ModelPriceEntry[] = [
  {
    providerID: "moonshotai-cn",
    providerLabel: "moonshot China",
    modelID: "kimi-k2.5",
    modelLabel: "K2.5",
    priceFor: () => kimiK25Price,
  },
  {
    providerID: "moonshotai-cn",
    providerLabel: "moonshot China",
    modelID: "kimi-k2.6",
    modelLabel: "K2.6",
    priceFor: () => kimiK26Price,
  },
  {
    providerID: "moonshotai-cn",
    providerLabel: "moonshot China",
    modelID: "kimi-k2.7-code",
    modelLabel: "K2.7 Code",
    priceFor: () => kimiK27CodePrice,
  }
]
