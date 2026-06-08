import type { ModelPriceEntry } from "./types.js"
import { usdPrice } from "./utils.js"

export const claudeSonnet46UsdPrice = {
  cacheHitInput: 0.3,
  cacheMissInput: 3,
  cacheWriteInput: 3.75,
  cacheWrite1hInput: 6,
  output: 15,
}

export const claudeOpusUsdPrice = {
  cacheHitInput: 0.5,
  cacheMissInput: 5,
  cacheWriteInput: 6.25,
  cacheWrite1hInput: 10,
  output: 25,
}

export const ANTHROPIC_ENTRIES: readonly ModelPriceEntry[] = [
  {
    providerID: "anthropic",
    providerLabel: "Anthropic",
    modelID: "claude-sonnet-4-6",
    modelLabel: "claude-sonnet-4-6",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, claudeSonnet46UsdPrice),
  },
  {
    providerID: "anthropic",
    providerLabel: "Anthropic",
    modelID: "claude-opus-4-6",
    modelLabel: "claude-opus-4-6",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, claudeOpusUsdPrice),
  },
  {
    providerID: "anthropic",
    providerLabel: "Anthropic",
    modelID: "claude-opus-4-7",
    modelLabel: "claude-opus-4-7",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, claudeOpusUsdPrice),
  },
  {
    providerID: "anthropic",
    providerLabel: "Anthropic",
    modelID: "claude-opus-4-8",
    modelLabel: "claude-opus-4-8",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, claudeOpusUsdPrice),
  },
]
