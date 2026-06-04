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

test("按 Alibaba China Qwen 人民币价格统计并给出模型提示", () => {
  expect(priceForModel("qwen3.7-max")).toEqual({
    cacheHitInput: 1.2,
    cacheMissInput: 6,
    output: 18,
    discounted: true,
    warnings: ["qwen3.7-max 当前按限时五折计价，官方暂未公布结束时间"],
  })
  expect(priceForModel("qwen3.6-plus", Date.now(), 256_000)).toEqual({
    cacheHitInput: 2,
    cacheMissInput: 2,
    output: 12,
    discounted: false,
  })
  expect(priceForModel("qwen3.6-plus", Date.now(), 256_001)).toEqual({
    cacheHitInput: 8,
    cacheMissInput: 8,
    output: 48,
    discounted: false,
    warnings: ["qwen3.6-plus 价格高昂警告"],
  })
  expect(BALANCE_TRACKED_PROVIDERS.map((item) => item.id)).toEqual(["deepseek", "moonshotai-cn"])

  const summary = calculateTrackedSession([
    {
      providerID: "alibaba-cn",
      modelID: "qwen3.7-max",
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
      providerID: "alibaba-cn",
      modelID: "qwen3.6-plus",
      tokens: {
        input: 256_001,
        output: 1_000_000,
        reasoning: 0,
        cache: {
          read: 0,
          write: 0,
        },
      },
    },
    {
      providerID: "alibaba-cn",
      modelID: "qwen3.6-plus",
      tokens: {
        input: 1_000,
        output: 1_000,
        reasoning: 0,
        cache: {
          read: 0,
          write: 0,
        },
      },
    },
  ])

  expect(summary.costCny).toBe(75.262008)
  expect(summary.models.map((item) => item.modelID)).toEqual(["qwen3.7-max", "qwen3.6-plus"])
  expect(summary.models[0]?.warnings).toEqual(["qwen3.7-max 当前按限时五折计价，官方暂未公布结束时间"])
  expect(summary.models[1]?.warnings).toEqual([
    "qwen3.6-plus 价格高昂警告",
    "多轮对话缓存命中为 0，请注意价格",
  ])
})

test("按 MiniMax M3 阶梯和限时五折人民币价格统计", () => {
  expect(priceForModel("minimax-m3", Date.parse("2026-06-07T23:59:59+08:00"), 512_000)).toEqual({
    cacheHitInput: 0.42,
    cacheMissInput: 2.1,
    output: 8.4,
    discounted: true,
    warnings: ["minimax-m3 上下文 <= 512K 当前按限时五折计价，特惠将于 2026-06-08 00:00:00 +08:00 结束"],
  })
  expect(priceForModel("minimax-m3", Date.parse("2026-06-08T00:00:00+08:00"), 512_000)).toEqual({
    cacheHitInput: 0.84,
    cacheMissInput: 4.2,
    output: 16.8,
    discounted: false,
  })
  expect(priceForModel("minimax-m3", Date.parse("2026-06-07T23:59:59+08:00"), 512_001)).toEqual({
    cacheHitInput: 1.68,
    cacheMissInput: 8.4,
    output: 33.6,
    discounted: false,
    warnings: ["minimax-m3 512K 到 1M 价格高昂警告"],
  })
  expect(BALANCE_TRACKED_PROVIDERS.map((item) => item.id)).toEqual(["deepseek", "moonshotai-cn"])

  const summary = calculateTrackedSession([
    {
      providerID: "minimax-cn",
      modelID: "minimax-m3",
      time: {
        completed: Date.parse("2026-06-01T12:00:00+08:00"),
      },
      tokens: {
        input: 400_000,
        output: 1_000_000,
        reasoning: 0,
        cache: {
          read: 100_000,
          write: 0,
        },
      },
    },
    {
      providerID: "minimax-cn",
      modelID: "minimax-m3",
      time: {
        completed: Date.parse("2026-06-01T12:00:00+08:00"),
      },
      tokens: {
        input: 512_001,
        output: 1_000_000,
        reasoning: 0,
        cache: {
          read: 0,
          write: 0,
        },
      },
    },
  ])

  expect(summary.turns).toBe(2)
  expect(summary.costCny).toBe(47.182808)
  expect(summary.models.map((item) => item.modelID)).toEqual(["minimax-m3"])
  expect(summary.models[0]?.providerID).toBe("minimax-cn")
  expect(summary.models[0]?.providerLabel).toBe("MiniMax")
  expect(summary.models[0]?.discountedTurns).toBe(1)
  expect(summary.models[0]?.warnings).toEqual([
    "minimax-m3 上下文 <= 512K 当前按限时五折计价，特惠将于 2026-06-08 00:00:00 +08:00 结束",
    "minimax-m3 512K 到 1M 价格高昂警告",
  ])
})

test("按 OpenRouter 和 xAI Grok Build 美元价格转换人民币统计", () => {
  expect(priceForModel("grok-build-0.1", Date.now(), 0, { usdCnyRate: 6.7867 })).toEqual({
    cacheHitInput: 1.35734,
    cacheMissInput: 6.7867,
    output: 13.5734,
    discounted: false,
  })
  expect(BALANCE_TRACKED_PROVIDERS.map((item) => item.id)).toEqual(["deepseek", "moonshotai-cn"])

  const summary = calculateTrackedSession(
    [
      {
        providerID: "openrouter",
        modelID: "x-ai/grok-build-0.1",
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
        providerID: "xai",
        modelID: "grok-build-0.1",
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
    ],
    { usdCnyRate: 6.7867 },
  )

  expect(summary.turns).toBe(2)
  expect(summary.costCny).toBe(42.07754)
  expect(summary.models.map((item) => `${item.providerID}:${item.modelID}`)).toEqual([
    "openrouter:x-ai/grok-build-0.1",
    "xai:grok-build-0.1",
  ])
})

test("Grok Build 汇率未就绪时先给出提示", () => {
  const summary = calculateTrackedSession([
    {
      providerID: "openrouter",
      modelID: "x-ai/grok-build-0.1",
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

  expect(summary.costCny).toBe(0)
  expect(summary.models[0]?.warnings).toEqual(["正在获取美元兑人民币汇率，成功后自动换算人民币价格"])
})

test("按 Anthropic Claude 美元价格转换人民币统计", () => {
expect(priceForModel("claude-sonnet-4-6", Date.now(), 0, { usdCnyRate: 7.1 })).toEqual({
    cacheHitInput: 2.13,
    cacheMissInput: 21.3,
    cacheWriteInput: 26.625,
    cacheWrite1hInput: 42.6,
    output: 106.5,
    discounted: false,
  })
  expect(priceForModel("claude-opus-4-6", Date.now(), 0, { usdCnyRate: 7.1 })).toEqual({
    cacheHitInput: 3.55,
    cacheMissInput: 35.5,
    cacheWriteInput: 44.375,
    cacheWrite1hInput: 71,
    output: 177.5,
    discounted: false,
  })
  expect(priceForModel("claude-opus-4-7", Date.now(), 0, { usdCnyRate: 7.1 })).toEqual({
    cacheHitInput: 3.55,
    cacheMissInput: 35.5,
    cacheWriteInput: 44.375,
    cacheWrite1hInput: 71,
    output: 177.5,
    discounted: false,
  })
  expect(priceForModel("claude-opus-4-8", Date.now(), 0, { usdCnyRate: 7.1 })).toEqual({
    cacheHitInput: 3.55,
    cacheMissInput: 35.5,
    cacheWriteInput: 44.375,
    cacheWrite1hInput: 71,
    output: 177.5,
    discounted: false,
  })

  const summary = calculateTrackedSession(
    [
      {
        providerID: "anthropic",
        modelID: "claude-sonnet-4-6",
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
        providerID: "anthropic",
        modelID: "claude-opus-4-8",
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
    ],
    { usdCnyRate: 7.1 },
  )

  expect(summary.turns).toBe(2)
  expect(summary.costCny).toBe(342.93)
  expect(summary.models.map((item) => item.modelID)).toEqual(["claude-sonnet-4-6", "claude-opus-4-8"])
})

test("Anthropic cache write 按 5 分钟写入价统计", () => {
  const summary = calculateTrackedSession(
    [
      {
        providerID: "anthropic",
        modelID: "claude-sonnet-4-6",
        tokens: {
          input: 0,
          output: 0,
          reasoning: 0,
          cache: {
            read: 0,
            write: 1_000_000,
          },
        },
      },
    ],
    { usdCnyRate: 7.1 },
  )

  expect(summary.costCny).toBe(26.625)
  expect(summary.models[0]?.cacheMissInputTokens).toBe(1_000_000)
  expect(summary.models[0]?.cacheHitInputTokens).toBe(0)
  expect(summary.cacheWrite1hCostCny).toBe(42.6)
})

test("Anthropic cache write 1h 估算仅对 Claude 模型有值", () => {
  const summary = calculateTrackedSession(
    [
      {
        providerID: "anthropic",
        modelID: "claude-opus-4-8",
        tokens: {
          input: 0,
          output: 500_000,
          reasoning: 0,
          cache: {
            read: 0,
            write: 1_000_000,
          },
        },
      },
      {
        providerID: "deepseek",
        modelID: "deepseek-v4-pro",
        tokens: {
          input: 100_000,
          output: 50_000,
          reasoning: 0,
          cache: {
            read: 0,
            write: 0,
          },
        },
      },
    ],
    { usdCnyRate: 7.1 },
  )

  expect(summary.cacheWrite1hCostCny).toBe(71)
})

test("按 Google 和 Google Vertex Gemini 3.5 Flash 美元价格转换人民币统计", () => {
  expect(priceForModel("gemini-3.5-flash", Date.now(), 0, { usdCnyRate: 7.1 })).toEqual({
    cacheHitInput: 1.065,
    cacheMissInput: 10.65,
    output: 63.9,
    discounted: false,
  })
  expect(BALANCE_TRACKED_PROVIDERS.map((item) => item.id)).toEqual(["deepseek", "moonshotai-cn"])

  const summary = calculateTrackedSession(
    [
      {
        providerID: "google",
        modelID: "gemini-3.5-flash",
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
        providerID: "google-vertex",
        modelID: "gemini-3.5-flash",
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
    ],
    { usdCnyRate: 7.1 },
  )

  expect(summary.turns).toBe(2)
  expect(summary.costCny).toBe(150.165)
  expect(summary.models.map((item) => `${item.providerID}:${item.modelID}`)).toEqual([
    "google:gemini-3.5-flash",
    "google-vertex:gemini-3.5-flash",
  ])
})

test("Gemini 3.5 Flash 汇率未就绪时先给出提示", () => {
  const summary = calculateTrackedSession([
    {
      providerID: "google",
      modelID: "gemini-3.5-flash",
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

  expect(summary.costCny).toBe(0)
  expect(summary.models[0]?.warnings).toEqual(["正在获取美元兑人民币汇率，成功后自动换算人民币价格"])
})

test("按 OpenAI API 美元价格转换人民币统计并处理长上下文", () => {
  expect(priceForModel("gpt-5.5", Date.now(), 272_000, { usdCnyRate: 7.1 })).toEqual({
    cacheHitInput: 3.55,
    cacheMissInput: 35.5,
    output: 213,
    discounted: false,
  })
  expect(priceForModel("gpt-5.5", Date.now(), 272_001, { usdCnyRate: 7.1 })).toEqual({
    cacheHitInput: 7.1,
    cacheMissInput: 71,
    output: 319.5,
    discounted: false,
  })
  expect(priceForModel("gpt-5.4", Date.now(), 272_001, { usdCnyRate: 7.1 })).toEqual({
    cacheHitInput: 3.55,
    cacheMissInput: 35.5,
    output: 159.75,
    discounted: false,
  })
  expect(priceForModel("gpt-5.4-mini", Date.now(), 272_001, { usdCnyRate: 7.1 })).toEqual({
    cacheHitInput: 0.5325,
    cacheMissInput: 5.325,
    output: 31.95,
    discounted: false,
  })

  const summary = calculateTrackedSession(
    [
      {
        providerID: "openai",
        modelID: "gpt-5.4",
        tokens: {
          input: 272_001,
          output: 1_000_000,
          reasoning: 0,
          cache: {
            read: 0,
            write: 0,
          },
        },
      },
      {
        providerID: "openai",
        modelID: "gpt-5.4-mini",
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
    ],
    { usdCnyRate: 7.1 },
  )

  expect(summary.turns).toBe(2)
  expect(summary.costCny).toBe(207.213536)
  expect(summary.models.map((item) => item.modelID)).toEqual(["gpt-5.4", "gpt-5.4-mini"])
})

test("按 Tencent TokenHub hy3-preview 阶梯人民币价格统计", () => {
  expect(priceForModel("hy3-preview", Date.now(), 15_999)).toEqual({
    cacheHitInput: 0.4,
    cacheMissInput: 1.2,
    output: 4,
    discounted: false,
  })
  expect(priceForModel("hy3-preview", Date.now(), 16_000)).toEqual({
    cacheHitInput: 0.6,
    cacheMissInput: 1.6,
    output: 6.4,
    discounted: false,
  })
  expect(priceForModel("hy3-preview", Date.now(), 31_999)).toEqual({
    cacheHitInput: 0.6,
    cacheMissInput: 1.6,
    output: 6.4,
    discounted: false,
  })
  expect(priceForModel("hy3-preview", Date.now(), 32_000)).toEqual({
    cacheHitInput: 0.8,
    cacheMissInput: 2,
    output: 8,
    discounted: false,
  })
  expect(BALANCE_TRACKED_PROVIDERS.map((item) => item.id)).toEqual(["deepseek", "moonshotai-cn"])

  const summary = calculateTrackedSession([
    {
      providerID: "tencent-tokenhub",
      modelID: "hy3-preview",
      tokens: {
        input: 1_000_000,
        output: 0,
        reasoning: 0,
        cache: {
          read: 0,
          write: 0,
        },
      },
    },
    {
      providerID: "tencent-tokenhub",
      modelID: "hy3-preview",
      tokens: {
        input: 0,
        output: 1_000_000,
        reasoning: 0,
        cache: {
          read: 0,
          write: 0,
        },
      },
    },
  ])

  expect(summary.turns).toBe(2)
  expect(summary.costCny).toBe(6)
  expect(summary.models.map((item) => item.modelID)).toEqual(["hy3-preview"])
  expect(summary.models[0]?.providerLabel).toBe("Tencent TokenHub")
})
