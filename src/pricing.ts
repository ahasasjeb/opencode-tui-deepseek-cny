export const DEEPSEEK_MODELS = ["deepseek-v4-flash", "deepseek-v4-pro"] as const
export type DeepseekModelID = (typeof DEEPSEEK_MODELS)[number]

export const PRO_DISCOUNT_START_BEIJING = "2026-04-26T20:15:00+08:00"
export const PRO_DISCOUNT_END_BEIJING = "2026-05-31T23:59:59+08:00"

type Price = {
  cacheHitInput: number
  cacheMissInput: number
  output: number
  discounted: boolean
}

type TokenUsage = {
  input: number
  output: number
  reasoning: number
  cache: {
    read: number
    write: number
  }
}

export type UsageRecord = {
  providerID: string
  modelID: string
  time?: {
    created?: number
    completed?: number
  }
  tokens: TokenUsage
}

export type ModelSubtotal = {
  modelID: DeepseekModelID
  turns: number
  cacheHitInputTokens: number
  cacheMissInputTokens: number
  outputTokens: number
  reasoningTokens: number
  costCny: number
  discountedTurns: number
}

export type SessionCostSummary = {
  turns: number
  cacheHitInputTokens: number
  cacheMissInputTokens: number
  outputTokens: number
  reasoningTokens: number
  costCny: number
  models: ModelSubtotal[]
}

const flashPrice: Price = {
  cacheHitInput: 0.02,
  cacheMissInput: 1,
  output: 2,
  discounted: false,
}

const proNormalPrice: Price = {
  cacheHitInput: 0.1,
  cacheMissInput: 12,
  output: 24,
  discounted: false,
}

const proDiscountPrice: Price = {
  cacheHitInput: 0.025,
  cacheMissInput: 3,
  output: 6,
  discounted: true,
}

export function priceForModel(modelID: DeepseekModelID, time = Date.now()): Price {
  if (modelID === "deepseek-v4-flash") return flashPrice
  if (time >= Date.parse(PRO_DISCOUNT_START_BEIJING) && time <= Date.parse(PRO_DISCOUNT_END_BEIJING)) {
    return proDiscountPrice
  }
  return proNormalPrice
}

export function calculateDeepseekSession(records: readonly UsageRecord[]): SessionCostSummary {
  const models = DEEPSEEK_MODELS.map((modelID) => subtotal(modelID, records)).filter((item) => item.turns > 0)

  return {
    turns: models.reduce((sum, item) => sum + item.turns, 0),
    cacheHitInputTokens: models.reduce((sum, item) => sum + item.cacheHitInputTokens, 0),
    cacheMissInputTokens: models.reduce((sum, item) => sum + item.cacheMissInputTokens, 0),
    outputTokens: models.reduce((sum, item) => sum + item.outputTokens, 0),
    reasoningTokens: models.reduce((sum, item) => sum + item.reasoningTokens, 0),
    costCny: roundMoney(models.reduce((sum, item) => sum + item.costCny, 0)),
    models,
  }
}

function subtotal(modelID: DeepseekModelID, records: readonly UsageRecord[]): ModelSubtotal {
  return records
    .filter((item) => item.providerID === "deepseek" && item.modelID === modelID)
    .reduce<ModelSubtotal>(
      (sum, item) => {
        const price = priceForModel(modelID, item.time?.completed ?? item.time?.created ?? Date.now())
        const cacheHitInputTokens = safe(item.tokens.cache.read)
        const cacheMissInputTokens = safe(item.tokens.input) + safe(item.tokens.cache.write)
        const outputTokens = safe(item.tokens.output) + safe(item.tokens.reasoning)

        return {
          modelID,
          turns: sum.turns + 1,
          cacheHitInputTokens: sum.cacheHitInputTokens + cacheHitInputTokens,
          cacheMissInputTokens: sum.cacheMissInputTokens + cacheMissInputTokens,
          outputTokens: sum.outputTokens + outputTokens,
          reasoningTokens: sum.reasoningTokens + safe(item.tokens.reasoning),
          costCny: roundMoney(
            sum.costCny +
              (cacheHitInputTokens * price.cacheHitInput +
                cacheMissInputTokens * price.cacheMissInput +
                outputTokens * price.output) /
                1_000_000,
          ),
          discountedTurns: sum.discountedTurns + (price.discounted ? 1 : 0),
        }
      },
      {
        modelID,
        turns: 0,
        cacheHitInputTokens: 0,
        cacheMissInputTokens: 0,
        outputTokens: 0,
        reasoningTokens: 0,
        costCny: 0,
        discountedTurns: 0,
      },
    )
}

function safe(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, value)
}

function roundMoney(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000
}
