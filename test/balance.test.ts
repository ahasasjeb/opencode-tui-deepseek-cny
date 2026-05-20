import { expect, test } from "bun:test"
import { parseDeepseekBalance } from "../src/balance.js"

test("解析 DeepSeek 余额接口", () => {
  const result = parseDeepseekBalance({
    is_available: true,
    balance_infos: [
      {
        currency: "CNY",
        total_balance: "110.00",
        granted_balance: "10.00",
        topped_up_balance: "100.00",
      },
    ],
  })

  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.balance.isAvailable).toBe(true)
  expect(result.balance.balances[0]).toEqual({
    currency: "CNY",
    totalBalance: "110.00",
    grantedBalance: "10.00",
    toppedUpBalance: "100.00",
  })
})

test("拒绝未知余额格式", () => {
  const result = parseDeepseekBalance({
    is_available: true,
    balance_infos: [{ currency: "CNY" }],
  })

  expect(result.ok).toBe(false)
})
