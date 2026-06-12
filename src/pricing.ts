export type {
  DeepseekModelID,
  KimiChinaModelID,
  XiaomiMiMoModelID,
  ZhipuAIModelID,
  AlibabaChinaModelID,
  MiniMaxChinaModelID,
  GrokBuildModelID,
  OpenRouterQwenModelID,
  OpenRouterNemotronModelID,
  AnthropicModelID,
  OpenAIModelID,
  GoogleVertexModelID,
  GoogleModelID,
  TencentTokenHubModelID,
  OpenCodeModelID,
  TrackedProviderID,
  TrackedModelID,
  TrackedProvider,
  BalanceTrackedProvider,
  BalanceProviderID,
  Price,
  TokenUsage,
  UsageRecord,
  ModelSubtotal,
  SessionCostSummary,
  ModelPriceEntry,
  PricingOptions,
} from "./pricing/types.js"

import { TRACKED_PROVIDERS } from "./pricing/types.js"
export { TRACKED_PROVIDERS }

import type {
  Price,
  TrackedModelID,
  TrackedProvider,
  BalanceTrackedProvider,
  UsageRecord,
  ModelSubtotal,
  SessionCostSummary,
  PricingOptions,
  ModelPriceEntry,
} from "./pricing/types.js"
import {
  safe,
  unique,
  roundMoney,
  NO_CACHE_AFTER_MULTI_TURN_WARNING,
  USD_CNY_RATE_PENDING_WARNING,
} from "./pricing/utils.js"
import { flashPrice, DEEPSEEK_ENTRIES } from "./pricing/deepseek.js"
import { kimiK25Price, kimiK26Price, kimiK27CodePrice, KIMI_ENTRIES } from "./pricing/kimi.js"
import { mimoV25Price, mimoV25ProPrice, XIAOMI_ENTRIES } from "./pricing/xiaomi.js"
import { ZHIPUAI_ENTRIES } from "./pricing/zhipuai.js"
import { ALIBABA_ENTRIES } from "./pricing/alibaba.js"
import { MINIMAX_ENTRIES } from "./pricing/minimax.js"
import { OPENROUTER_ENTRIES } from "./pricing/openrouter.js"
import { XAI_ENTRIES } from "./pricing/xai.js"
import { ANTHROPIC_ENTRIES } from "./pricing/anthropic.js"
import { OPENAI_ENTRIES } from "./pricing/openai.js"
import { GOOGLE_ENTRIES } from "./pricing/google.js"
import {
  hy3PreviewShortContextPrice,
  hy3PreviewMediumContextPrice,
  hy3PreviewLongContextPrice,
  TENCENT_ENTRIES,
} from "./pricing/tencent.js"
import { hy3PreviewTieredPrice } from "./pricing/utils.js"
import { OPENCODE_ENTRIES } from "./pricing/opencode.js"

const MODEL_PRICES: readonly ModelPriceEntry[] = [
  ...DEEPSEEK_ENTRIES,
  ...KIMI_ENTRIES,
  ...XIAOMI_ENTRIES,
  ...ZHIPUAI_ENTRIES,
  ...ALIBABA_ENTRIES,
  ...MINIMAX_ENTRIES,
  ...OPENROUTER_ENTRIES,
  ...XAI_ENTRIES,
  ...ANTHROPIC_ENTRIES,
  ...OPENAI_ENTRIES,
  ...GOOGLE_ENTRIES,
  ...TENCENT_ENTRIES,
  ...OPENCODE_ENTRIES,
]

export function trackedModel(providerID: string, modelID: string) {
  return MODEL_PRICES.find((item) => item.providerID === providerID && item.modelID === modelID)
}

export function priceForModel(modelID: TrackedModelID, time = Date.now(), inputTokens = 0, options: PricingOptions = {}): Price {
  if (modelID === "deepseek-v4-flash") return flashPrice
  if (modelID === "deepseek-v4-pro") return DEEPSEEK_ENTRIES[1]!.priceFor(time, inputTokens, options)
  if (modelID === "kimi-k2.5") return kimiK25Price
  if (modelID === "kimi-k2.6") return kimiK26Price
  if (modelID === "kimi-k2.7-code") return kimiK27CodePrice
  if (modelID === "mimo-v2.5") return mimoV25Price
  if (modelID === "mimo-v2.5-pro") return mimoV25ProPrice
  if (modelID === "gemini-3.5-flash") {
    return GOOGLE_ENTRIES.find((item) => item.modelID === modelID && item.providerID === "google")!.priceFor(time, inputTokens, options)
  }
  if (modelID === "hy3-preview") return hy3PreviewTieredPrice(inputTokens, hy3PreviewShortContextPrice, hy3PreviewMediumContextPrice, hy3PreviewLongContextPrice)
  return MODEL_PRICES.find((item) => item.modelID === modelID)!.priceFor(time, inputTokens, options)
}

export function supportsBalance(provider: TrackedProvider): provider is BalanceTrackedProvider {
  return provider.balance
}

export const BALANCE_TRACKED_PROVIDERS = TRACKED_PROVIDERS.filter(supportsBalance)

export function calculateTrackedSession(records: readonly UsageRecord[], options: PricingOptions = {}): SessionCostSummary {
  const models = MODEL_PRICES.map((entry) => subtotal(entry, records, options)).filter((item) => item.turns > 0)

  return {
    turns: models.reduce((sum, item) => sum + item.turns, 0),
    cacheHitInputTokens: models.reduce((sum, item) => sum + item.cacheHitInputTokens, 0),
    cacheMissInputTokens: models.reduce((sum, item) => sum + item.cacheMissInputTokens, 0),
    outputTokens: models.reduce((sum, item) => sum + item.outputTokens, 0),
    reasoningTokens: models.reduce((sum, item) => sum + item.reasoningTokens, 0),
    costCny: roundMoney(models.reduce((sum, item) => sum + item.costCny, 0)),
    cacheWrite1hCostCny: roundMoney(models.reduce((sum, item) => sum + item.cacheWrite1hCostCny, 0)),
    models,
  }
}

export function calculateDeepseekSession(records: readonly UsageRecord[]): SessionCostSummary {
  return calculateTrackedSession(records.filter((item) => item.providerID === "deepseek"))
}

function subtotal(entry: ModelPriceEntry, records: readonly UsageRecord[], options: PricingOptions): ModelSubtotal {
  const sum = records
    .filter((item) => item.providerID === entry.providerID && item.modelID === entry.modelID)
    .reduce<ModelSubtotal>(
      (sum, item) => {
        const cacheHitInputTokens = safe(item.tokens.cache.read)
        const cacheWriteInputTokens = safe(item.tokens.cache.write)
        const cacheMissInputTokens = safe(item.tokens.input) + cacheWriteInputTokens
        const inputTokens = cacheHitInputTokens + cacheMissInputTokens
        const price = entry.priceFor(item.time?.completed ?? item.time?.created ?? Date.now(), inputTokens, options)
        const outputTokens = safe(item.tokens.output) + safe(item.tokens.reasoning)
        const cacheWriteInputPrice = price.cacheWriteInput ?? price.cacheMissInput
        const cacheWrite1hInputPrice = price.cacheWrite1hInput ?? price.cacheWriteInput ?? price.cacheMissInput

        return {
          providerID: entry.providerID,
          providerLabel: entry.providerLabel,
          modelID: entry.modelID,
          modelLabel: entry.modelLabel,
          turns: sum.turns + 1,
          cacheHitInputTokens: sum.cacheHitInputTokens + cacheHitInputTokens,
          cacheMissInputTokens: sum.cacheMissInputTokens + cacheMissInputTokens,
          outputTokens: sum.outputTokens + outputTokens,
          reasoningTokens: sum.reasoningTokens + safe(item.tokens.reasoning),
          costCny: roundMoney(
            sum.costCny +
            (cacheHitInputTokens * price.cacheHitInput +
              safe(item.tokens.input) * price.cacheMissInput +
              cacheWriteInputTokens * cacheWriteInputPrice +
              outputTokens * price.output) /
            1_000_000,
          ),
          cacheWrite1hCostCny: roundMoney(
            sum.cacheWrite1hCostCny +
            cacheWriteInputTokens * cacheWrite1hInputPrice / 1_000_000,
          ),
          discountedTurns: sum.discountedTurns + (price.discounted ? 1 : 0),
          warnings: unique([...sum.warnings, ...(price.warnings ?? [])]),
        }
      },
      {
        providerID: entry.providerID,
        providerLabel: entry.providerLabel,
        modelID: entry.modelID,
        modelLabel: entry.modelLabel,
        turns: 0,
        cacheHitInputTokens: 0,
        cacheMissInputTokens: 0,
        outputTokens: 0,
        reasoningTokens: 0,
        costCny: 0,
        cacheWrite1hCostCny: 0,
        discountedTurns: 0,
        warnings: [],
      },
    )

  return sum.turns > 1 && sum.cacheHitInputTokens === 0 && !(sum.costCny === 0 && !sum.warnings.includes(USD_CNY_RATE_PENDING_WARNING))
    ? {
      ...sum,
      warnings: unique([...sum.warnings, NO_CACHE_AFTER_MULTI_TURN_WARNING]),
    }
    : sum
}
