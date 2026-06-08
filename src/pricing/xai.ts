import type { ModelPriceEntry } from "./types.js"
import { usdPrice } from "./utils.js"
import { grokBuildUsdPrice } from "./openrouter.js"

export const XAI_ENTRIES: readonly ModelPriceEntry[] = [
  {
    providerID: "xai",
    providerLabel: "xAI",
    modelID: "grok-build-0.1",
    modelLabel: "grok-build-0.1",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, grokBuildUsdPrice),
  },
  {
    providerID: "xai",
    providerLabel: "xAI",
    modelID: "x-ai/grok-build-0.1",
    modelLabel: "x-ai/grok-build-0.1",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, grokBuildUsdPrice),
  },
]
