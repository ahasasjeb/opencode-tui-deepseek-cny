export type DeepseekModelID = "deepseek-v4-flash" | "deepseek-v4-pro"

export type KimiChinaModelID = "kimi-k2.5" | "kimi-k2.6"

export type XiaomiMiMoModelID = "mimo-v2.5" | "mimo-v2.5-pro"

export type ZhipuAIModelID = "glm-5.1" | "glm-5-turbo" | "glm-5"

export type AlibabaChinaModelID = "qwen3.7-max" | "qwen3.6-plus"

export type MiniMaxChinaModelID = "minimax-m3"

export type GrokBuildModelID = "grok-build-0.1" | "x-ai/grok-build-0.1"

export type AnthropicModelID = "claude-sonnet-4-6" | "claude-opus-4-6" | "claude-opus-4-7" | "claude-opus-4-8"

export type OpenAIModelID = "gpt-5.5" | "gpt-5.4" | "gpt-5.4-mini"

export type GoogleVertexModelID = "gemini-3.5-flash"

export type GoogleModelID = "gemini-3.5-flash"

export type TencentTokenHubModelID = "hy3-preview"

type TrackedProviderEntry = {
  id: string
  label: string
  env: readonly string[]
  balance: boolean
}
//必须与 https://models.dev/api.json 严格对应，包括空格等细节，以确保正确匹配模型和价格

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
  {
    id: "zhipuai",
    label: "ZhipuAI",
    env: [],
    balance: false,
  },
  {
    id: "alibaba-cn",
    label: "Alibaba Cloud",
    env: [],
    balance: false,
  },
  {
    id: "minimax-cn",
    label: "MiniMax",
    env: [],
    balance: false,
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    env: [],
    balance: false,
  },
  {
    id: "xai",
    label: "xAI",
    env: [],
    balance: false,
  },
  {
    id: "anthropic",
    label: "Anthropic",
    env: [],
    balance: false,
  },
  {
    id: "openai",
    label: "OpenAI API",
    env: [],
    balance: false,
  },
  {
    id: "google",
    label: "Google",
    env: [],
    balance: false,
  },
  {
    id: "google-vertex",
    label: "Google Vertex",
    env: [],
    balance: false,
  },
  {
    id: "tencent-tokenhub",
    label: "Tencent TokenHub",
    env: [],
    balance: false,
  },
] as const satisfies readonly TrackedProviderEntry[]

export type TrackedProviderID = (typeof TRACKED_PROVIDERS)[number]["id"]
export type TrackedModelID =
  | DeepseekModelID
  | KimiChinaModelID
  | XiaomiMiMoModelID
  | ZhipuAIModelID
  | AlibabaChinaModelID
  | MiniMaxChinaModelID
  | GrokBuildModelID
  | AnthropicModelID
  | OpenAIModelID
  | GoogleVertexModelID
  | GoogleModelID
  | TencentTokenHubModelID
export type TrackedProvider = (typeof TRACKED_PROVIDERS)[number]
export type BalanceTrackedProvider = Extract<TrackedProvider, { balance: true }>
export type BalanceProviderID = BalanceTrackedProvider["id"]

type Price = {
  cacheHitInput: number
  cacheMissInput: number
  cacheWriteInput?: number
  cacheWrite1hInput?: number
  output: number
  discounted: boolean
  warnings?: readonly string[]
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
  cacheWrite1hCostCny: number
  discountedTurns: number
  warnings: string[]
}

export type SessionCostSummary = {
  turns: number
  cacheHitInputTokens: number
  cacheMissInputTokens: number
  outputTokens: number
  reasoningTokens: number
  costCny: number
  cacheWrite1hCostCny: number
  models: ModelSubtotal[]
}

type ModelPriceEntry = {
  providerID: TrackedProviderID
  providerLabel: string
  modelID: TrackedModelID
  modelLabel: string
  priceFor: (time: number, inputTokens: number, options: PricingOptions) => Price
}

export type PricingOptions = {
  usdCnyRate?: number
}

const ZHIPU_CONTEXT_TIER_THRESHOLD_TOKENS = 32_000
const QWEN_PLUS_CONTEXT_TIER_THRESHOLD_TOKENS = 256_000
const MINIMAX_M3_CONTEXT_TIER_THRESHOLD_TOKENS = 512_000
const OPENAI_LONG_CONTEXT_THRESHOLD_TOKENS = 272_000
const HY3_PREVIEW_SHORT_CONTEXT_THRESHOLD_TOKENS = 16_000
const HY3_PREVIEW_MEDIUM_CONTEXT_THRESHOLD_TOKENS = 32_000
const MINIMAX_M3_DISCOUNT_END_TIME = Date.parse("2026-06-08T00:00:00+08:00")
const QWEN_EXPENSIVE_CONTEXT_WARNING = "qwen3.6-plus 价格高昂警告"
const MINIMAX_M3_EXPENSIVE_CONTEXT_WARNING = "minimax-m3 512K 到 1M 价格高昂警告"
const NO_CACHE_AFTER_MULTI_TURN_WARNING = "多轮对话缓存命中为 0，请注意价格"
const USD_CNY_RATE_PENDING_WARNING = "正在获取美元兑人民币汇率，成功后自动换算人民币价格"

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

const glm51ShortContextPrice: Price = {
  cacheHitInput: 1.3,
  cacheMissInput: 6,
  output: 24,
  discounted: false,
}

const glm51LongContextPrice: Price = {
  cacheHitInput: 2,
  cacheMissInput: 8,
  output: 28,
  discounted: false,
}

const glm5TurboShortContextPrice: Price = {
  cacheHitInput: 1.2,
  cacheMissInput: 5,
  output: 22,
  discounted: false,
}

const glm5TurboLongContextPrice: Price = {
  cacheHitInput: 1.8,
  cacheMissInput: 7,
  output: 26,
  discounted: false,
}

const glm5ShortContextPrice: Price = {
  cacheHitInput: 1,
  cacheMissInput: 4,
  output: 18,
  discounted: false,
}

const glm5LongContextPrice: Price = {
  cacheHitInput: 1.5,
  cacheMissInput: 6,
  output: 22,
  discounted: false,
}

const qwen37MaxDiscountPrice: Price = {
  cacheHitInput: 1.2,
  cacheMissInput: 6,
  output: 18,
  discounted: true,
  warnings: ["qwen3.7-max 当前按限时五折计价，官方暂未公布结束时间"],
}

const qwen36PlusShortContextPrice: Price = {
  cacheHitInput: 2,
  cacheMissInput: 2,
  output: 12,
  discounted: false,
}

const qwen36PlusLongContextPrice: Price = {
  cacheHitInput: 8,
  cacheMissInput: 8,
  output: 48,
  discounted: false,
  warnings: [QWEN_EXPENSIVE_CONTEXT_WARNING],
}

const minimaxM3ShortContextDiscountPrice: Price = {
  cacheHitInput: 0.42,
  cacheMissInput: 2.1,
  output: 8.4,
  discounted: true,
  warnings: ["minimax-m3 上下文 <= 512K 当前按限时五折计价，特惠将于 2026-06-08 00:00:00 +08:00 结束"],
}

const minimaxM3ShortContextPrice: Price = {
  cacheHitInput: 0.84,
  cacheMissInput: 4.2,
  output: 16.8,
  discounted: false,
}

const minimaxM3LongContextPrice: Price = {
  cacheHitInput: 1.68,
  cacheMissInput: 8.4,
  output: 33.6,
  discounted: false,
  warnings: [MINIMAX_M3_EXPENSIVE_CONTEXT_WARNING],
}

const grokBuildUsdPrice = {
  cacheHitInput: 0.2,
  cacheMissInput: 1,
  output: 2,
}

const claudeSonnet46UsdPrice = {
  cacheHitInput: 0.3,
  cacheMissInput: 3,
  cacheWriteInput: 3.75,
  cacheWrite1hInput: 6,
  output: 15,
}

const claudeOpusUsdPrice = {
  cacheHitInput: 0.5,
  cacheMissInput: 5,
  cacheWriteInput: 6.25,
  cacheWrite1hInput: 10,
  output: 25,
}

const gpt55UsdPrice = {
  cacheHitInput: 0.5,
  cacheMissInput: 5,
  output: 30,
}

const gpt54UsdPrice = {
  cacheHitInput: 0.25,
  cacheMissInput: 2.5,
  output: 15,
}

const gpt54MiniUsdPrice = {
  cacheHitInput: 0.075,
  cacheMissInput: 0.75,
  output: 4.5,
}

const gemini35FlashUsdPrice = {
  cacheHitInput: 0.15,
  cacheMissInput: 1.5,
  output: 9,
}

const hy3PreviewShortContextPrice: Price = {
  cacheHitInput: 0.4,
  cacheMissInput: 1.2,
  output: 4,
  discounted: false,
}

const hy3PreviewMediumContextPrice: Price = {
  cacheHitInput: 0.6,
  cacheMissInput: 1.6,
  output: 6.4,
  discounted: false,
}

const hy3PreviewLongContextPrice: Price = {
  cacheHitInput: 0.8,
  cacheMissInput: 2,
  output: 8,
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
  {
    providerID: "zhipuai",
    providerLabel: "ZhipuAI",
    modelID: "glm-5.1",
    modelLabel: "GLM-5.1",
    priceFor: (_time, inputTokens) => zhipuTieredPrice(inputTokens, glm51ShortContextPrice, glm51LongContextPrice),
  },
  {
    providerID: "zhipuai",
    providerLabel: "ZhipuAI",
    modelID: "glm-5-turbo",
    modelLabel: "GLM-5-Turbo",
    priceFor: (_time, inputTokens) =>
      zhipuTieredPrice(inputTokens, glm5TurboShortContextPrice, glm5TurboLongContextPrice),
  },
  {
    providerID: "zhipuai",
    providerLabel: "ZhipuAI",
    modelID: "glm-5",
    modelLabel: "GLM-5",
    priceFor: (_time, inputTokens) => zhipuTieredPrice(inputTokens, glm5ShortContextPrice, glm5LongContextPrice),
  },
  {
    providerID: "alibaba-cn",
    providerLabel: "Alibaba Cloud",
    modelID: "qwen3.7-max",
    modelLabel: "qwen3.7-max",
    priceFor: () => qwen37MaxDiscountPrice,
  },
  {
    providerID: "alibaba-cn",
    providerLabel: "Alibaba Cloud",
    modelID: "qwen3.6-plus",
    modelLabel: "qwen3.6-plus",
    priceFor: (_time, inputTokens) => qwenPlusTieredPrice(inputTokens),
  },
  {
    providerID: "minimax-cn",
    providerLabel: "MiniMax",
    modelID: "minimax-m3",
    modelLabel: "MiniMax-M3",
    priceFor: (time, inputTokens) => minimaxM3TieredPrice(time, inputTokens),
  },
  {
    providerID: "openrouter",
    providerLabel: "OpenRouter",
    modelID: "x-ai/grok-build-0.1",
    modelLabel: "x-ai/grok-build-0.1",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, grokBuildUsdPrice),
  },
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
  {
    providerID: "tencent-tokenhub",
    providerLabel: "Tencent TokenHub",
    modelID: "hy3-preview",
    modelLabel: "Hy3 Preview",
    priceFor: (_time, inputTokens) => hy3PreviewTieredPrice(inputTokens),
  },
]

export function trackedModel(providerID: string, modelID: string) {
  return MODEL_PRICES.find((item) => item.providerID === providerID && item.modelID === modelID)
}

export function priceForModel(modelID: TrackedModelID, time = Date.now(), inputTokens = 0, options: PricingOptions = {}): Price {
  if (modelID === "deepseek-v4-flash") return flashPrice
  if (modelID === "deepseek-v4-pro") return MODEL_PRICES[1]!.priceFor(time, inputTokens, options)
  if (modelID === "kimi-k2.5") return kimiK25Price
  if (modelID === "kimi-k2.6") return kimiK26Price
  if (modelID === "mimo-v2.5") return mimoV25Price
  if (modelID === "mimo-v2.5-pro") return mimoV25ProPrice
  if (modelID === "gemini-3.5-flash") {
    return MODEL_PRICES.find((item) => item.modelID === modelID && item.providerID === "google")!.priceFor(time, inputTokens, options)
  }
  if (modelID === "hy3-preview") return hy3PreviewTieredPrice(inputTokens)
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

  return sum.turns > 1 && sum.cacheHitInputTokens === 0
    ? {
      ...sum,
      warnings: unique([...sum.warnings, NO_CACHE_AFTER_MULTI_TURN_WARNING]),
    }
    : sum
}

function safe(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, value)
}

function zhipuTieredPrice(inputTokens: number, shortContextPrice: Price, longContextPrice: Price) {
  return inputTokens < ZHIPU_CONTEXT_TIER_THRESHOLD_TOKENS ? shortContextPrice : longContextPrice
}

function qwenPlusTieredPrice(inputTokens: number) {
  return inputTokens <= QWEN_PLUS_CONTEXT_TIER_THRESHOLD_TOKENS
    ? qwen36PlusShortContextPrice
    : qwen36PlusLongContextPrice
}

function minimaxM3TieredPrice(time: number, inputTokens: number) {
  if (inputTokens > MINIMAX_M3_CONTEXT_TIER_THRESHOLD_TOKENS) return minimaxM3LongContextPrice
  return time < MINIMAX_M3_DISCOUNT_END_TIME ? minimaxM3ShortContextDiscountPrice : minimaxM3ShortContextPrice
}

function hy3PreviewTieredPrice(inputTokens: number) {
  if (inputTokens < HY3_PREVIEW_SHORT_CONTEXT_THRESHOLD_TOKENS) return hy3PreviewShortContextPrice
  if (inputTokens < HY3_PREVIEW_MEDIUM_CONTEXT_THRESHOLD_TOKENS) return hy3PreviewMediumContextPrice
  return hy3PreviewLongContextPrice
}

function openAILongContextPrice(
  inputTokens: number,
  options: PricingOptions,
  price: Omit<Price, "discounted" | "warnings">,
) {
  if (inputTokens <= OPENAI_LONG_CONTEXT_THRESHOLD_TOKENS) return usdPrice(options.usdCnyRate, price)
  return usdPrice(options.usdCnyRate, {
    cacheHitInput: price.cacheHitInput * 2,
    cacheMissInput: price.cacheMissInput * 2,
    output: price.output * 1.5,
  })
}

function usdPrice(rate: number | undefined, price: Omit<Price, "discounted" | "warnings">): Price {
  if (!Number.isFinite(rate) || rate === undefined || rate <= 0) {
    return {
      cacheHitInput: 0,
      cacheMissInput: 0,
      output: 0,
      discounted: false,
      warnings: [USD_CNY_RATE_PENDING_WARNING],
    }
  }

  const cacheWriteInput = price.cacheWriteInput !== undefined ? roundMoney(price.cacheWriteInput * rate) : undefined
  const cacheWrite1hInput = price.cacheWrite1hInput !== undefined ? roundMoney(price.cacheWrite1hInput * rate) : undefined
  return {
    cacheHitInput: roundMoney(price.cacheHitInput * rate),
    cacheMissInput: roundMoney(price.cacheMissInput * rate),
    cacheWriteInput,
    cacheWrite1hInput,
    output: roundMoney(price.output * rate),
    discounted: false,
  }
}

function unique(values: readonly string[]) {
  return [...new Set(values)]
}

function roundMoney(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000
}
