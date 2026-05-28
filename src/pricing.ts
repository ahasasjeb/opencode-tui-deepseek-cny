export type DeepseekModelID = "deepseek-v4-flash" | "deepseek-v4-pro"

export type KimiChinaModelID = "kimi-k2.5" | "kimi-k2.6"

export type XiaomiMiMoModelID = "mimo-v2.5" | "mimo-v2.5-pro"

type TrackedProviderEntry = {
  id: string
  label: string
  env: readonly string[]
  balance: boolean
}

export const TRACKED_PROVIDERS = [
  {
    id: "deepseek",
    label: "DeepSeek",
    env: ["DEEPSEEK_API_KEY"],
    balance: true,
  },
  {
    id: "moonshotai-cn",
    label: "moonshot China",
    env: ["MOONSHOT_API_KEY"],
    balance: true,
  },
  {
    id: "xiaomi",
    label: "Xiaomi MiMo",
    env: [],
    balance: false,
  },
] as const satisfies readonly TrackedProviderEntry[]

export type TrackedProviderID = (typeof TRACKED_PROVIDERS)[number]["id"]
export type TrackedModelID = DeepseekModelID | KimiChinaModelID | XiaomiMiMoModelID
export type TrackedProvider = (typeof TRACKED_PROVIDERS)[number]
export type BalanceTrackedProvider = Extract<TrackedProvider, { balance: true }>
export type BalanceProviderID = BalanceTrackedProvider["id"]

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

const proPrice: Price = {
  cacheHitInput: 0.025,
  cacheMissInput: 3,
  output: 6,
  discounted: false,
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

const mimoV25Price: Price = {
  cacheHitInput: 0.02,
  cacheMissInput: 1,
  output: 2,
  discounted: false,
}

const mimoV25ProPrice: Price = {
  cacheHitInput: 0.025,
  cacheMissInput: 3,
  output: 6,
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
    priceFor: () => proPrice,
  },
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

export function trackedModel(providerID: string, modelID: string) {
  return MODEL_PRICES.find((item) => item.providerID === providerID && item.modelID === modelID)
}

export function priceForModel(modelID: TrackedModelID, time = Date.now()): Price {
  if (modelID === "deepseek-v4-flash") return flashPrice
  if (modelID === "deepseek-v4-pro") return MODEL_PRICES[1]!.priceFor(time)
  if (modelID === "kimi-k2.5") return kimiK25Price
  if (modelID === "kimi-k2.6") return kimiK26Price
  if (modelID === "mimo-v2.5") return mimoV25Price
  return mimoV25ProPrice
}

export function supportsBalance(provider: TrackedProvider): provider is BalanceTrackedProvider {
  return provider.balance
}

export const BALANCE_TRACKED_PROVIDERS = TRACKED_PROVIDERS.filter(supportsBalance)

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
