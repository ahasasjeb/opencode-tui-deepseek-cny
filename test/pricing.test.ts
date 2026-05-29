import { expect, test } from "bun:test"
import { BALANCE_TRACKED_PROVIDERS, calculateDeepseekSession, calculateTrackedSession, priceForModel } from "../src/pricing.js"

test("按 DeepSeek V4 Flash 人民币价格统计", () => {
  const summary = calculateDeepseekSession([
    {
      providerID: "deepseek",
      modelID: "deepseek-v4-flash",
      tokens: {
        input: 1_000_000,
        output: 1_000_000,
        reasoning: 0,
        cache: {
          read: 1_000_000,
          write: 0,
        },
      },
    },
  ])

  expect(summary.costCny).toBe(3.02)
  expect(summary.models[0]?.cacheHitInputTokens).toBe(1_000_000)
  expect(summary.models[0]?.cacheMissInputTokens).toBe(1_000_000)
})

test("DeepSeek V4 Pro 常态化采用特价", () => {
  const price = priceForModel("deepseek-v4-pro", Date.parse("2026-05-20T12:00:00+08:00"))

  expect(price.cacheHitInput).toBe(0.025)
  expect(price.cacheMissInput).toBe(3)
  expect(price.output).toBe(6)
  expect(price.discounted).toBe(false)
})

test("DeepSeek V4 Pro 不再按日期恢复原价", () => {
  const price = priceForModel("deepseek-v4-pro", Date.parse("2026-06-01T00:00:00+08:00"))

  expect(price.cacheHitInput).toBe(0.025)
  expect(price.cacheMissInput).toBe(3)
  expect(price.output).toBe(6)
  expect(price.discounted).toBe(false)
})

test("只统计 deepseek 提供商和指定 V4 模型", () => {
  const summary = calculateDeepseekSession([
    {
      providerID: "openrouter",
      modelID: "deepseek-v4-pro",
      tokens: {
        input: 1_000_000,
        output: 1_000_000,
        reasoning: 0,
        cache: {
          read: 0,
          write: 0,
        },
      },
    },
    {
      providerID: "deepseek",
      modelID: "deepseek-chat",
      tokens: {
        input: 1_000_000,
        output: 1_000_000,
        reasoning: 0,
        cache: {
          read: 0,
          write: 0,
        },
      },
    },
  ])

  expect(summary.turns).toBe(0)
  expect(summary.costCny).toBe(0)
})

test("按 Kimi China K2.5 和 K2.6 人民币价格统计", () => {
  const summary = calculateTrackedSession([
    {
      providerID: "moonshotai-cn",
      modelID: "kimi-k2.5",
      tokens: {
        input: 1_000_000,
        output: 1_000_000,
        reasoning: 0,
        cache: {
          read: 1_000_000,
          write: 0,
        },
      },
    },
    {
      providerID: "moonshotai-cn",
      modelID: "kimi-k2.6",
      tokens: {
        input: 1_000_000,
        output: 1_000_000,
        reasoning: 0,
        cache: {
          read: 1_000_000,
          write: 0,
        },
      },
    },
  ])

  expect(summary.costCny).toBe(60.3)
  expect(summary.models.map((item) => item.modelID)).toEqual(["kimi-k2.5", "kimi-k2.6"])
})

test("按 Xiaomi MiMo 人民币价格统计且不参与余额查询", () => {
  expect(priceForModel("mimo-v2.5")).toEqual({
    cacheHitInput: 0.02,
    cacheMissInput: 1,
    output: 2,
    discounted: false,
  })
  expect(priceForModel("mimo-v2.5-pro")).toEqual({
    cacheHitInput: 0.025,
    cacheMissInput: 3,
    output: 6,
    discounted: false,
  })
  expect(BALANCE_TRACKED_PROVIDERS.map((item) => item.id)).toEqual(["deepseek", "moonshotai-cn"])

  const summary = calculateTrackedSession([
    {
      providerID: "xiaomi",
      modelID: "mimo-v2.5",
      tokens: {
        input: 1_000_000,
        output: 1_000_000,
        reasoning: 0,
        cache: {
          read: 1_000_000,
          write: 0,
        },
      },
    },
    {
      providerID: "xiaomi",
      modelID: "mimo-v2.5-pro",
      tokens: {
        input: 1_000_000,
        output: 1_000_000,
        reasoning: 0,
        cache: {
          read: 1_000_000,
          write: 0,
        },
      },
    },
  ])

  expect(summary.turns).toBe(2)
  expect(summary.costCny).toBe(12.045)
  expect(summary.models.map((item) => item.modelID)).toEqual(["mimo-v2.5", "mimo-v2.5-pro"])
  expect(summary.models[0]?.providerLabel).toBe("Xiaomi MiMo")
})

test("按 ZhipuAI GLM 阶梯人民币价格统计且不参与余额查询", () => {
  expect(priceForModel("glm-5.1", Date.now(), 31_999)).toEqual({
    cacheHitInput: 1.3,
    cacheMissInput: 6,
    output: 24,
    discounted: false,
  })
  expect(priceForModel("glm-5.1", Date.now(), 32_000)).toEqual({
    cacheHitInput: 2,
    cacheMissInput: 8,
    output: 28,
    discounted: false,
  })
  expect(priceForModel("glm-5-turbo", Date.now(), 31_999)).toEqual({
    cacheHitInput: 1.2,
    cacheMissInput: 5,
    output: 22,
    discounted: false,
  })
  expect(priceForModel("glm-5-turbo", Date.now(), 32_000)).toEqual({
    cacheHitInput: 1.8,
    cacheMissInput: 7,
    output: 26,
    discounted: false,
  })
  expect(priceForModel("glm-5", Date.now(), 31_999)).toEqual({
    cacheHitInput: 1,
    cacheMissInput: 4,
    output: 18,
    discounted: false,
  })
  expect(priceForModel("glm-5", Date.now(), 32_000)).toEqual({
    cacheHitInput: 1.5,
    cacheMissInput: 6,
    output: 22,
    discounted: false,
  })
  expect(BALANCE_TRACKED_PROVIDERS.map((item) => item.id)).toEqual(["deepseek", "moonshotai-cn"])

  const summary = calculateTrackedSession([
    {
      providerID: "zhipuai",
      modelID: "glm-5.1",
      tokens: {
        input: 31_999,
        output: 1_000_000,
        reasoning: 0,
        cache: {
          read: 0,
          write: 0,
        },
      },
    },
    {
      providerID: "zhipuai",
      modelID: "glm-5.1",
      tokens: {
        input: 31_000,
        output: 0,
        reasoning: 0,
        cache: {
          read: 1_000,
          write: 0,
        },
      },
    },
  ])

  expect(summary.costCny).toBe(24.441994)
  expect(summary.models.map((item) => item.modelID)).toEqual(["glm-5.1"])
  expect(summary.models[0]?.providerLabel).toBe("ZhipuAI")
})
