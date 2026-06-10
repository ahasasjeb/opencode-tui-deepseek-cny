import type { Price, ModelPriceEntry } from "./types.js"
import { usdPrice, opencodeTieredPrice } from "./utils.js"

export const opencodeFreePrice: Price = { cacheHitInput: 0, cacheMissInput: 0, output: 0, discounted: false }

export const opencodeminimaxm27UsdPrice = { cacheHitInput: 0.06, cacheMissInput: 0.3, cacheWriteInput: 0.375, output: 1.2 }
export const opencodeminimaxm25UsdPrice = { cacheHitInput: 0.06, cacheMissInput: 0.3, cacheWriteInput: 0.375, output: 1.2 }
export const opencodeminimaxm21UsdPrice = { cacheHitInput: 0.1, cacheMissInput: 0.3, output: 1.2 }

export const opencodeglm51UsdPrice = { cacheHitInput: 0.26, cacheMissInput: 1.4, output: 4.4 }
export const opencodeglm5UsdPrice = { cacheHitInput: 0.2, cacheMissInput: 1, output: 3.2 }
export const opencodeglm46UsdPrice = { cacheHitInput: 0.1, cacheMissInput: 0.6, output: 2.2 }
export const opencodeglm47UsdPrice = { cacheHitInput: 0.1, cacheMissInput: 0.6, output: 2.2 }

export const opencodekimik25UsdPrice = { cacheHitInput: 0.1, cacheMissInput: 0.6, output: 3 }
export const opencodekimik26UsdPrice = { cacheHitInput: 0.16, cacheMissInput: 0.95, output: 4 }
export const opencodekimik2UsdPrice = { cacheHitInput: 0.4, cacheMissInput: 0.4, output: 2.5 }
export const opencodekimik2thinkingUsdPrice = { cacheHitInput: 0.4, cacheMissInput: 0.4, output: 2.5 }

export const opencodeqwen35plusUsdPrice = { cacheHitInput: 0.02, cacheMissInput: 0.2, cacheWriteInput: 0.25, output: 1.2 }
export const opencodeqwen36plusUsdPrice = { cacheHitInput: 0.05, cacheMissInput: 0.5, cacheWriteInput: 0.625, output: 3 }
export const opencodeqwen3coderUsdPrice = { cacheHitInput: 0, cacheMissInput: 0.45, output: 1.8 }
export const opencodeqwen37maxUsdPrice = { cacheHitInput: 0.5, cacheMissInput: 2.5, cacheWriteInput: 3.125, output: 7.5 }
export const opencodeqwen37plusUsdPrice = { cacheHitInput: 0.04, cacheMissInput: 0.4, cacheWriteInput: 0.5, output: 1.6 }

export const opencodedeepseekv4flashUsdPrice = { cacheHitInput: 0.028, cacheMissInput: 0.14, output: 0.28 }
export const opencodedeepseekv4proUsdPrice = { cacheHitInput: 0.145, cacheMissInput: 1.74, output: 3.48 }
export const opencodegrokbuild01UsdPrice = { cacheHitInput: 0.2, cacheMissInput: 1, output: 2 }

export const opencodeclaudeopus45UsdPrice = { cacheHitInput: 0.5, cacheMissInput: 5, cacheWriteInput: 6.25, output: 25 }
export const opencodeclaudeopus46UsdPrice = { cacheHitInput: 0.5, cacheMissInput: 5, cacheWriteInput: 6.25, output: 25 }
export const opencodeclaudeopus47UsdPrice = { cacheHitInput: 0.5, cacheMissInput: 5, cacheWriteInput: 6.25, output: 25 }
export const opencodeclaudeopus48UsdPrice = { cacheHitInput: 0.5, cacheMissInput: 5, cacheWriteInput: 6.25, output: 25 }
export const opencodeclaudeopus41UsdPrice = { cacheHitInput: 1.5, cacheMissInput: 15, cacheWriteInput: 18.75, output: 75 }

export const opencodeclaudesonnet4ShortContextUsdPrice = { cacheHitInput: 0.3, cacheMissInput: 3, cacheWriteInput: 3.75, output: 15 }
export const opencodeclaudesonnet4LongContextUsdPrice = { cacheHitInput: 0.6, cacheMissInput: 6, cacheWriteInput: 7.5, output: 22.5 }
export const opencodeclaudesonnet45ShortContextUsdPrice = { cacheHitInput: 0.3, cacheMissInput: 3, cacheWriteInput: 3.75, output: 15 }
export const opencodeclaudesonnet45LongContextUsdPrice = { cacheHitInput: 0.6, cacheMissInput: 6, cacheWriteInput: 7.5, output: 22.5 }
export const opencodeclaudesonnet46UsdPrice = { cacheHitInput: 0.3, cacheMissInput: 3, cacheWriteInput: 3.75, output: 15 }

export const opencodeclaudehaiku45UsdPrice = { cacheHitInput: 0.1, cacheMissInput: 1, cacheWriteInput: 1.25, output: 5 }
export const opencodeclaude35haikuUsdPrice = { cacheHitInput: 0.08, cacheMissInput: 0.8, cacheWriteInput: 1, output: 4 }
export const opencodeclaudefable5UsdPrice = { cacheHitInput: 1, cacheMissInput: 10, cacheWriteInput: 12.5, output: 50 }

export const opencodegemini35flashUsdPrice = { cacheHitInput: 0.15, cacheMissInput: 1.5, output: 9 }
export const opencodegemini31proShortContextUsdPrice = { cacheHitInput: 0.2, cacheMissInput: 2, output: 12 }
export const opencodegemini31proLongContextUsdPrice = { cacheHitInput: 0.4, cacheMissInput: 4, output: 18 }
export const opencodegemini3flashUsdPrice = { cacheHitInput: 0.05, cacheMissInput: 0.5, output: 3 }
export const opencodegemini3proShortContextUsdPrice = { cacheHitInput: 0.2, cacheMissInput: 2, output: 12 }
export const opencodegemini3proLongContextUsdPrice = { cacheHitInput: 0.4, cacheMissInput: 4, output: 18 }

export const opencodegpt55ShortContextUsdPrice = { cacheHitInput: 0.5, cacheMissInput: 5, output: 30 }
export const opencodegpt55LongContextUsdPrice = { cacheHitInput: 1, cacheMissInput: 10, output: 45 }
export const opencodegpt55proUsdPrice = { cacheHitInput: 30, cacheMissInput: 30, output: 180 }
export const opencodegpt54ShortContextUsdPrice = { cacheHitInput: 0.25, cacheMissInput: 2.5, output: 15 }
export const opencodegpt54LongContextUsdPrice = { cacheHitInput: 0.5, cacheMissInput: 5, output: 22.5 }
export const opencodegpt54proUsdPrice = { cacheHitInput: 30, cacheMissInput: 30, output: 180 }
export const opencodegpt54miniUsdPrice = { cacheHitInput: 0.075, cacheMissInput: 0.75, output: 4.5 }
export const opencodegpt54nanoUsdPrice = { cacheHitInput: 0.02, cacheMissInput: 0.2, output: 1.25 }
export const opencodegpt53codexUsdPrice = { cacheHitInput: 0.175, cacheMissInput: 1.75, output: 14 }
export const opencodegpt53codexsparkUsdPrice = { cacheHitInput: 0.175, cacheMissInput: 1.75, output: 14 }
export const opencodegpt52UsdPrice = { cacheHitInput: 0.175, cacheMissInput: 1.75, output: 14 }
export const opencodegpt52codexUsdPrice = { cacheHitInput: 0.175, cacheMissInput: 1.75, output: 14 }
export const opencodegpt51UsdPrice = { cacheHitInput: 0.107, cacheMissInput: 1.07, output: 8.5 }
export const opencodegpt51codexUsdPrice = { cacheHitInput: 0.107, cacheMissInput: 1.07, output: 8.5 }
export const opencodegpt51codexmaxUsdPrice = { cacheHitInput: 0.125, cacheMissInput: 1.25, output: 10 }
export const opencodegpt51codexminiUsdPrice = { cacheHitInput: 0.025, cacheMissInput: 0.25, output: 2 }
export const opencodegpt5UsdPrice = { cacheHitInput: 0.107, cacheMissInput: 1.07, output: 8.5 }
export const opencodegpt5codexUsdPrice = { cacheHitInput: 0.107, cacheMissInput: 1.07, output: 8.5 }
export const opencodegpt5nanoUsdPrice = { cacheHitInput: 0.005, cacheMissInput: 0.05, output: 0.4 }

export const OPENCODE_ENTRIES: readonly ModelPriceEntry[] = [
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "big-pickle", modelLabel: "Big Pickle", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "deepseek-v4-flash-free", modelLabel: "DeepSeek V4 Flash Free", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "mimo-v2.5-free", modelLabel: "MiMo V2.5 Free", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "nemotron-3-ultra-free", modelLabel: "Nemotron 3 Ultra Free", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "nemotron-3-super-free", modelLabel: "Nemotron 3 Super Free", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "hy3-preview-free", modelLabel: "Hy3 Preview Free", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "mimo-v2-flash-free", modelLabel: "MiMo V2 Flash Free", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "mimo-v2-omni-free", modelLabel: "MiMo V2 Omni Free", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "mimo-v2-pro-free", modelLabel: "MiMo V2 Pro Free", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "ring-2.6-1t-free", modelLabel: "Ring 2.6 1T Free", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "trinity-large-preview-free", modelLabel: "Trinity Large Preview Free", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "qwen3.6-plus-free", modelLabel: "Qwen3.6 Plus Free", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "minimax-m2.1-free", modelLabel: "MiniMax M2.1 Free", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "minimax-m2.5-free", modelLabel: "MiniMax M2.5 Free", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "minimax-m3-free", modelLabel: "MiniMax M3 Free", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "glm-4.7-free", modelLabel: "GLM-4.7 Free", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "glm-5-free", modelLabel: "GLM-5 Free", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "grok-code", modelLabel: "Grok Code", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "kimi-k2.5-free", modelLabel: "Kimi K2.5 Free", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "ling-2.6-flash-free", modelLabel: "Ling 2.6 Flash Free", priceFor: () => opencodeFreePrice },
  { providerID: "opencode", providerLabel: "OpenCode Zen", modelID: "north-mini-code-free", modelLabel: "North Mini Code Free", priceFor: () => opencodeFreePrice },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "minimax-m2.7",
    modelLabel: "MiniMax M2.7",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeminimaxm27UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "minimax-m2.5",
    modelLabel: "MiniMax M2.5",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeminimaxm25UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "minimax-m2.1",
    modelLabel: "MiniMax M2.1",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeminimaxm21UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "glm-5.1",
    modelLabel: "GLM-5.1",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeglm51UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "glm-5",
    modelLabel: "GLM-5",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeglm5UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "glm-4.6",
    modelLabel: "GLM-4.6",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeglm46UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "glm-4.7",
    modelLabel: "GLM-4.7",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeglm47UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "kimi-k2.5",
    modelLabel: "Kimi K2.5",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodekimik25UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "kimi-k2.6",
    modelLabel: "Kimi K2.6",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodekimik26UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "kimi-k2",
    modelLabel: "Kimi K2",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodekimik2UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "kimi-k2-thinking",
    modelLabel: "Kimi K2 Thinking",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodekimik2thinkingUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "qwen3.5-plus",
    modelLabel: "Qwen3.5 Plus",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeqwen35plusUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "qwen3.6-plus",
    modelLabel: "Qwen3.6 Plus",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeqwen36plusUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "qwen3.7-plus",
    modelLabel: "Qwen3.7 Plus",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeqwen37plusUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "qwen3-coder",
    modelLabel: "Qwen3 Coder",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeqwen3coderUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "qwen3.7-max",
    modelLabel: "Qwen3.7 Max",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeqwen37maxUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "deepseek-v4-flash",
    modelLabel: "DeepSeek V4 Flash",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodedeepseekv4flashUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "deepseek-v4-pro",
    modelLabel: "DeepSeek V4 Pro",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodedeepseekv4proUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "grok-build-0.1",
    modelLabel: "Grok Build 0.1",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodegrokbuild01UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "claude-opus-4-5",
    modelLabel: "Claude Opus 4.5",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeclaudeopus45UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "claude-opus-4-6",
    modelLabel: "Claude Opus 4.6",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeclaudeopus46UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "claude-opus-4-7",
    modelLabel: "Claude Opus 4.7",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeclaudeopus47UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "claude-opus-4-8",
    modelLabel: "Claude Opus 4.8",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeclaudeopus48UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "claude-opus-4-1",
    modelLabel: "Claude Opus 4.1",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeclaudeopus41UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "claude-sonnet-4",
    modelLabel: "Claude Sonnet 4",
    priceFor: (_time, inputTokens, options) => opencodeTieredPrice(inputTokens, options, opencodeclaudesonnet4ShortContextUsdPrice, opencodeclaudesonnet4LongContextUsdPrice, 200_000),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "claude-sonnet-4-5",
    modelLabel: "Claude Sonnet 4.5",
    priceFor: (_time, inputTokens, options) => opencodeTieredPrice(inputTokens, options, opencodeclaudesonnet45ShortContextUsdPrice, opencodeclaudesonnet45LongContextUsdPrice, 200_000),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "claude-sonnet-4-6",
    modelLabel: "Claude Sonnet 4.6",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeclaudesonnet46UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "claude-haiku-4-5",
    modelLabel: "Claude Haiku 4.5",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeclaudehaiku45UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "claude-3-5-haiku",
    modelLabel: "Claude Haiku 3.5",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeclaude35haikuUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "claude-fable-5",
    modelLabel: "Claude Fable 5",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodeclaudefable5UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gemini-3.5-flash",
    modelLabel: "Gemini 3.5 Flash",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodegemini35flashUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gemini-3.1-pro",
    modelLabel: "Gemini 3.1 Pro",
    priceFor: (_time, inputTokens, options) => opencodeTieredPrice(inputTokens, options, opencodegemini31proShortContextUsdPrice, opencodegemini31proLongContextUsdPrice, 200_000),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gemini-3-flash",
    modelLabel: "Gemini 3 Flash",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodegemini3flashUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gemini-3-pro",
    modelLabel: "Gemini 3 Pro",
    priceFor: (_time, inputTokens, options) => opencodeTieredPrice(inputTokens, options, opencodegemini3proShortContextUsdPrice, opencodegemini3proLongContextUsdPrice, 200_000),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gpt-5.5",
    modelLabel: "GPT-5.5",
    priceFor: (_time, inputTokens, options) => opencodeTieredPrice(inputTokens, options, opencodegpt55ShortContextUsdPrice, opencodegpt55LongContextUsdPrice, 272_000),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gpt-5.5-pro",
    modelLabel: "GPT-5.5 Pro",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodegpt55proUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gpt-5.4",
    modelLabel: "GPT-5.4",
    priceFor: (_time, inputTokens, options) => opencodeTieredPrice(inputTokens, options, opencodegpt54ShortContextUsdPrice, opencodegpt54LongContextUsdPrice, 272_000),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gpt-5.4-pro",
    modelLabel: "GPT-5.4 Pro",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodegpt54proUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gpt-5.4-mini",
    modelLabel: "GPT-5.4 Mini",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodegpt54miniUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gpt-5.4-nano",
    modelLabel: "GPT-5.4 Nano",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodegpt54nanoUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gpt-5.3-codex",
    modelLabel: "GPT-5.3 Codex",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodegpt53codexUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gpt-5.3-codex-spark",
    modelLabel: "GPT-5.3 Codex Spark",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodegpt53codexsparkUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gpt-5.2",
    modelLabel: "GPT-5.2",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodegpt52UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gpt-5.2-codex",
    modelLabel: "GPT-5.2 Codex",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodegpt52codexUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gpt-5.1",
    modelLabel: "GPT-5.1",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodegpt51UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gpt-5.1-codex",
    modelLabel: "GPT-5.1 Codex",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodegpt51codexUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gpt-5.1-codex-max",
    modelLabel: "GPT-5.1 Codex Max",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodegpt51codexmaxUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gpt-5.1-codex-mini",
    modelLabel: "GPT-5.1 Codex Mini",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodegpt51codexminiUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gpt-5",
    modelLabel: "GPT-5",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodegpt5UsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gpt-5-codex",
    modelLabel: "GPT-5 Codex",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodegpt5codexUsdPrice),
  },
  {
    providerID: "opencode",
    providerLabel: "OpenCode Zen",
    modelID: "gpt-5-nano",
    modelLabel: "GPT-5 Nano",
    priceFor: (_time, _inputTokens, options) => usdPrice(options.usdCnyRate, opencodegpt5nanoUsdPrice),
  },
]
