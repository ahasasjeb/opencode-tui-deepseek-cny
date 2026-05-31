import { expect, test } from "bun:test"
import { parseUsdCnyRate } from "../src/exchange-rate.js"

test("解析 USD/CNY 汇率接口", () => {
  const result = parseUsdCnyRate({
    code: 200,
    uptime: "2026-05-31 08:00:01",
    money: "1",
    from: "USD",
    to: "CNY",
    result: 6.7867,
    rate: "6.7867",
  })

  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.rate).toBe(6.7867)
  expect(result.updatedAt).toBe("2026-05-31 08:00:01")
})

test("兼容接口前后带噪声的文本响应", () => {
  const result = parseUsdCnyRate(`[P{
    "code": 200,
    "uptime": "2026-05-31 08:00:01",
    "money": "1",
    "from": "USD",
    "to": "CNY",
    "result": 6.7867,
    "rate": "6.7867"
  }`)

  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.rate).toBe(6.7867)
})

test("拒绝非 USD/CNY 汇率格式", () => {
  const result = parseUsdCnyRate({
    code: 200,
    from: "EUR",
    to: "CNY",
    rate: "7.2",
  })

  expect(result.ok).toBe(false)
})
