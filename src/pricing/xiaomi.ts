import type { Price, ModelPriceEntry } from "./types.js"

export const mimoV25Price: Price = {
  cacheHitInput: 0.02,
  cacheMissInput: 1,
  output: 2,
  discounted: false,
}

export const mimoV25ProPrice: Price = {
  cacheHitInput: 0.025,
  cacheMissInput: 3,
  output: 6,
  discounted: false,
}

export const XIAOMI_ENTRIES: readonly ModelPriceEntry[] = [
  {
    providerID: "xiaomi",
    providerLabel: "Xiaomi MiMo",
    modelID: "mimo-v2.5",
    modelLabel: "V2.5",
    priceFor: () => mimoV25Price,
  },
  {
    providerID: "xiaomi",
    providerLabel: "Xiaomi MiMo",
    modelID: "mimo-v2.5-pro",
    modelLabel: "V2.5 Pro",
    priceFor: () => mimoV25ProPrice,
  },
]
