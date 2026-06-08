import type { ModelPriceEntry } from "./types.js"
import { usdPrice, openAILongContextPrice } from "./utils.js"

export const gpt55UsdPrice = {
  cacheHitInput: 0.5,
  cacheMissInput: 5,
  output: 30,
}

export const gpt54UsdPrice = {
  cacheHitInput: 0.25,
  cacheMissInput: 2.5,
  output: 15,
}

export const gpt54MiniUsdPrice = {
  cacheHitInput: 0.075,
  cacheMissInput: 0.75,
  output: 4.5,
}

export const OPENAI_ENTRIES: readonly ModelPriceEntry[] = [
  {
    providerID: "openai",
    providerLabel: "OpenAI API",
    modelID: "gpt-5.5",
    modelLabel: "GPT-5.5",
    priceFor: (_time, inputTokens, options) => openAILongContextPrice(inputTokens, options, gpt55UsdPrice),
  },
  {
    providerID: "openai",
    providerLabel: "OpenAI API",
    modelID: "gpt-5.4",
    modelLabel: "GPT-5.4",
    priceFor: (_time, inputTokens, options) => openAILongContextPrice(inputTokens, options, gpt54UsdPrice),
  },
  {
    providerID: "openai",
    providerLabel: "OpenAI API",
    modelID: "gpt-5.4-mini",
    modelLabel: "GPT-5.4 mini",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, gpt54MiniUsdPrice),
  },
]
