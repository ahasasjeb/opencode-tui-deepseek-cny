export const DEEPSEEK_MODELS = ["deepseek-v4-flash", "deepseek-v4-pro"] as const
export type DeepseekModelID = (typeof DEEPSEEK_MODELS)[number]

export const KIMI_CHINA_MODELS = ["kimi-k2.5", "kimi-k2.6"] as const
export type KimiChinaModelID = (typeof KIMI_CHINA_MODELS)[number]

export const TRACKED_PROVIDERS = [
  {
    id: "deepseek",
    label: "DeepSeek",
    env: ["DEEPSEEK_API_KEY"],
  },
  {
    id: "moonshotai-cn",
    label: "Kimi CN",
    env: ["MOONSHOT_API_KEY"],
  },
] as const

export type TrackedProviderID = (typeof TRACKED_PROVIDERS)[number]["id"]
export type TrackedModelID = DeepseekModelID | KimiChinaModelID

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
  providerID: TrackedProviderID
  providerLabel: string
  modelID: TrackedModelID
  modelLabel: string
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

type ModelPriceEntry = {
  providerID: TrackedProviderID
  providerLabel: string
  modelID: TrackedModelID
  modelLabel: string
  priceFor: (time: number) => Price
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

const kimiK25Price: Price = {
  cacheHitInput: 0.7,
  cacheMissInput: 4,
  output: 21,
  discounted: false,
}

const kimiK26Price: Price = {
  cacheHitInput: 1.1,
  cacheMissInput: 6.5,
  output: 27,
  discounted: false,
}

const MODEL_PRICES: readonly ModelPriceEntry[] = [
  {
    providerID: "deepseek",
    providerLabel: "DeepSeek",
    modelID: "deepseek-v4-flash",
    modelLabel: "V4 Flash",
    priceFor: () => flashPrice,
  },
  {
    providerID: "deepseek",
    providerLabel: "DeepSeek",
    modelID: "deepseek-v4-pro",
    modelLabel: "V4 Pro",
    priceFor: (time) =>
      time >= Date.parse(PRO_DISCOUNT_START_BEIJING) && time <= Date.parse(PRO_DISCOUNT_END_BEIJING)
        ? proDiscountPrice
        : proNormalPrice,
  },
  {
    providerID: "moonshotai-cn",
    providerLabel: "Kimi CN",
    modelID: "kimi-k2.5",
    modelLabel: "K2.5",
    priceFor: () => kimiK25Price,
  },
  {
    providerID: "moonshotai-cn",
    providerLabel: "Kimi CN",
    modelID: "kimi-k2.6",
    modelLabel: "K2.6",
    priceFor: () => kimiK26Price,
  },
]

export function trackedProvider(value: string) {
  return TRACKED_PROVIDERS.find((item) => item.id === value)
}

export function trackedModel(providerID: string, modelID: string) {
  return MODEL_PRICES.find((item) => item.providerID === providerID && item.modelID === modelID)
}

export function priceForModel(modelID: TrackedModelID, time = Date.now()): Price {
  if (modelID === "deepseek-v4-flash") return flashPrice
  if (modelID === "deepseek-v4-pro") return MODEL_PRICES[1]!.priceFor(time)
  if (modelID === "kimi-k2.5") return kimiK25Price
  return kimiK26Price
}

export function calculateTrackedSession(records: readonly UsageRecord[]): SessionCostSummary {
  const models = MODEL_PRICES.map((entry) => subtotal(entry, records)).filter((item) => item.turns > 0)

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

export function calculateDeepseekSession(records: readonly UsageRecord[]): SessionCostSummary {
  return calculateTrackedSession(records.filter((item) => item.providerID === "deepseek"))
}

function subtotal(entry: ModelPriceEntry, records: readonly UsageRecord[]): ModelSubtotal {
  return records
    .filter((item) => item.providerID === entry.providerID && item.modelID === entry.modelID)
    .reduce<ModelSubtotal>(
      (sum, item) => {
        const price = entry.priceFor(item.time?.completed ?? item.time?.created ?? Date.now())
        const cacheHitInputTokens = safe(item.tokens.cache.read)
        const cacheMissInputTokens = safe(item.tokens.input) + safe(item.tokens.cache.write)
        const outputTokens = safe(item.tokens.output) + safe(item.tokens.reasoning)

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
                cacheMissInputTokens * price.cacheMissInput +
                outputTokens * price.output) /
                1_000_000,
          ),
          discountedTurns: sum.discountedTurns + (price.discounted ? 1 : 0),
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
