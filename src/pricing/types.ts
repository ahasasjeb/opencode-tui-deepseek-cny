export type DeepseekModelID = "deepseek-v4-flash" | "deepseek-v4-pro"

export type KimiChinaModelID = "kimi-k2.5" | "kimi-k2.6"

export type XiaomiMiMoModelID = "mimo-v2.5" | "mimo-v2.5-pro"

export type ZhipuAIModelID = "glm-5.1" | "glm-5-turbo" | "glm-5"

export type AlibabaChinaModelID = "qwen3.7-max" | "qwen3.6-plus"

export type MiniMaxChinaModelID = "minimax-m3"

export type GrokBuildModelID = "grok-build-0.1" | "x-ai/grok-build-0.1"

export type OpenRouterQwenModelID =
  | "qwen/qwen3.5-122b-a10b"
  | "qwen/qwen3.6-27b"
  | "qwen/qwen3.5-9b"
  | "qwen/qwen3.5-35b-a3b"
  | "qwen/qwen3.6-35b-a3b"
  | "qwen/qwen3.5-397b-a17b"
  | "qwen/qwen3.5-27b"

export type OpenRouterNemotronModelID = "nvidia/nemotron-3-ultra-550b-a55b"

export type AnthropicModelID = "claude-sonnet-4-6" | "claude-opus-4-6" | "claude-opus-4-7" | "claude-opus-4-8"

export type OpenAIModelID = "gpt-5.5" | "gpt-5.4" | "gpt-5.4-mini"

export type GoogleVertexModelID = "gemini-3.5-flash"

export type GoogleModelID = "gemini-3.5-flash"

export type TencentTokenHubModelID = "hy3-preview"

export type OpenCodeModelID =
  | "big-pickle"
  | "deepseek-v4-flash-free"
  | "mimo-v2.5-free"
  | "nemotron-3-ultra-free"
  | "nemotron-3-super-free"
  | "hy3-preview-free"
  | "mimo-v2-flash-free"
  | "mimo-v2-omni-free"
  | "mimo-v2-pro-free"
  | "ring-2.6-1t-free"
  | "trinity-large-preview-free"
  | "qwen3.6-plus-free"
  | "minimax-m2.1-free"
  | "minimax-m2.5-free"
  | "minimax-m3-free"
  | "glm-4.7-free"
  | "glm-5-free"
  | "grok-code"
  | "kimi-k2.5-free"
  | "ling-2.6-flash-free"
  | "north-mini-code-free"
  | "minimax-m2.7"
  | "minimax-m2.5"
  | "minimax-m2.1"
  | "glm-5.1"
  | "glm-5"
  | "glm-4.6"
  | "glm-4.7"
  | "kimi-k2.5"
  | "kimi-k2.6"
  | "kimi-k2.7-code"
  | "kimi-k2"
  | "kimi-k2-thinking"
  | "qwen3.5-plus"
  | "qwen3.6-plus"
  | "qwen3.7-max"
  | "qwen3.7-plus"
  | "qwen3-coder"
  | "deepseek-v4-flash"
  | "deepseek-v4-pro"
  | "grok-build-0.1"
  | "claude-opus-4-5"
  | "claude-opus-4-6"
  | "claude-opus-4-7"
  | "claude-opus-4-8"
  | "claude-opus-4-1"
  | "claude-sonnet-4"
  | "claude-sonnet-4-5"
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5"
  | "claude-3-5-haiku"
  | "claude-fable-5"
  | "gemini-3.5-flash"
  | "gemini-3.1-pro"
  | "gemini-3-flash"
  | "gemini-3-pro"
  | "gpt-5.5"
  | "gpt-5.5-pro"
  | "gpt-5.4"
  | "gpt-5.4-pro"
  | "gpt-5.4-mini"
  | "gpt-5.4-nano"
  | "gpt-5.3-codex"
  | "gpt-5.3-codex-spark"
  | "gpt-5.2"
  | "gpt-5.2-codex"
  | "gpt-5.1"
  | "gpt-5.1-codex"
  | "gpt-5.1-codex-max"
  | "gpt-5.1-codex-mini"
  | "gpt-5"
  | "gpt-5-codex"
  | "gpt-5-nano"

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
    id: "opencode",
    label: "OpenCode Zen",
    env: ["OPENCODE_API_KEY"],
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
  | OpenRouterQwenModelID
  | OpenRouterNemotronModelID
  | AnthropicModelID
  | OpenAIModelID
  | GoogleVertexModelID
  | GoogleModelID
  | TencentTokenHubModelID
  | OpenCodeModelID
export type TrackedProvider = (typeof TRACKED_PROVIDERS)[number]
export type BalanceTrackedProvider = Extract<TrackedProvider, { balance: true }>
export type BalanceProviderID = BalanceTrackedProvider["id"]

export type Price = {
  cacheHitInput: number
  cacheMissInput: number
  cacheWriteInput?: number
  cacheWrite1hInput?: number
  output: number
  discounted: boolean
  warnings?: readonly string[]
}

export type TokenUsage = {
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

export type ModelPriceEntry = {
  providerID: TrackedProviderID
  providerLabel: string
  modelID: TrackedModelID
  modelLabel: string
  priceFor: (time: number, inputTokens: number, options: PricingOptions) => Price
}

export type PricingOptions = {
  usdCnyRate?: number
}
