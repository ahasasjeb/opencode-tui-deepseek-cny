import type { ModelPriceEntry } from "./types.js"
import { usdPrice } from "./utils.js"

export const grokBuildUsdPrice = {
  cacheHitInput: 0.2,
  cacheMissInput: 1,
  output: 2,
}

export const qwen35_122bA10bUsdPrice = {
  cacheHitInput: 0.26,
  cacheMissInput: 0.26,
  output: 2.08,
}

export const qwen36_27bUsdPrice = {
  cacheHitInput: 0.16,
  cacheMissInput: 0.29,
  output: 3.2,
}

export const qwen35_9bUsdPrice = {
  cacheHitInput: 0.04,
  cacheMissInput: 0.04,
  output: 0.15,
}

export const qwen35_35bA3bUsdPrice = {
  cacheHitInput: 0.05,
  cacheMissInput: 0.14,
  output: 1,
}

export const qwen36_35bA3bUsdPrice = {
  cacheHitInput: 0.05,
  cacheMissInput: 0.14,
  output: 1,
}

export const qwen35_397bA17bUsdPrice = {
  cacheHitInput: 0.34,
  cacheMissInput: 0.39,
  output: 2.34,
}

export const qwen35_27bUsdPrice = {
  cacheHitInput: 0.195,
  cacheMissInput: 0.195,
  output: 1.56,
}

export const nemotron3Ultra550bA55bUsdPrice = {
  cacheHitInput: 0.15,
  cacheMissInput: 0.5,
  output: 2.5,
}

export const OPENROUTER_ENTRIES: readonly ModelPriceEntry[] = [
  {
    providerID: "openrouter",
    providerLabel: "OpenRouter",
    modelID: "x-ai/grok-build-0.1",
    modelLabel: "x-ai/grok-build-0.1",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, grokBuildUsdPrice),
  },
  {
    providerID: "openrouter",
    providerLabel: "OpenRouter",
    modelID: "qwen/qwen3.5-122b-a10b",
    modelLabel: "qwen/qwen3.5-122b-a10b",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, qwen35_122bA10bUsdPrice),
  },
  {
    providerID: "openrouter",
    providerLabel: "OpenRouter",
    modelID: "qwen/qwen3.6-27b",
    modelLabel: "qwen/qwen3.6-27b",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, qwen36_27bUsdPrice),
  },
  {
    providerID: "openrouter",
    providerLabel: "OpenRouter",
    modelID: "qwen/qwen3.5-9b",
    modelLabel: "qwen/qwen3.5-9b",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, qwen35_9bUsdPrice),
  },
  {
    providerID: "openrouter",
    providerLabel: "OpenRouter",
    modelID: "qwen/qwen3.5-35b-a3b",
    modelLabel: "qwen/qwen3.5-35b-a3b",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, qwen35_35bA3bUsdPrice),
  },
  {
    providerID: "openrouter",
    providerLabel: "OpenRouter",
    modelID: "qwen/qwen3.6-35b-a3b",
    modelLabel: "qwen/qwen3.6-35b-a3b",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, qwen36_35bA3bUsdPrice),
  },
  {
    providerID: "openrouter",
    providerLabel: "OpenRouter",
    modelID: "qwen/qwen3.5-397b-a17b",
    modelLabel: "qwen/qwen3.5-397b-a17b",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, qwen35_397bA17bUsdPrice),
  },
  {
    providerID: "openrouter",
    providerLabel: "OpenRouter",
    modelID: "qwen/qwen3.5-27b",
    modelLabel: "qwen/qwen3.5-27b",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, qwen35_27bUsdPrice),
  },
  {
    providerID: "openrouter",
    providerLabel: "OpenRouter",
    modelID: "nvidia/nemotron-3-ultra-550b-a55b",
    modelLabel: "nvidia/nemotron-3-ultra-550b-a55b",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, nemotron3Ultra550bA55bUsdPrice),
  },
]
