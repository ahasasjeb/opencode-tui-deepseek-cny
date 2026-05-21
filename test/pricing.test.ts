import { expect, test } from "bun:test"
import { calculateDeepseekSession, calculateTrackedSession, priceForModel } from "../src/pricing.js"

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

test("DeepSeek V4 Pro 在优惠期内采用特价", () => {
  const price = priceForModel("deepseek-v4-pro", Date.parse("2026-05-20T12:00:00+08:00"))

  expect(price.cacheHitInput).toBe(0.025)
  expect(price.cacheMissInput).toBe(3)
  expect(price.output).toBe(6)
  expect(price.discounted).toBe(true)
})

test("DeepSeek V4 Pro 优惠期外采用原价", () => {
  const price = priceForModel("deepseek-v4-pro", Date.parse("2026-06-01T00:00:00+08:00"))

  expect(price.cacheHitInput).toBe(0.1)
  expect(price.cacheMissInput).toBe(12)
  expect(price.output).toBe(24)
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
