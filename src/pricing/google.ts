import type { ModelPriceEntry } from "./types.js"
import { usdPrice } from "./utils.js"

export const gemini35FlashUsdPrice = {
  cacheHitInput: 0.15,
  cacheMissInput: 1.5,
  output: 9,
}

export const GOOGLE_ENTRIES: readonly ModelPriceEntry[] = [
  {
    providerID: "google",
    providerLabel: "Google",
    modelID: "gemini-3.5-flash",
    modelLabel: "Gemini 3.5 Flash",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, gemini35FlashUsdPrice),
  },
  {
    providerID: "google-vertex",
    providerLabel: "Google Vertex",
    modelID: "gemini-3.5-flash",
    modelLabel: "Gemini 3.5 Flash",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, gemini35FlashUsdPrice),
  },
]
