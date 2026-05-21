import { expect, test } from "bun:test"
import { parseDeepseekBalance, parseMoonshotBalance } from "../src/balance.js"

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

test("解析 Kimi China 余额接口", () => {
  const result = parseMoonshotBalance({
    code: 0,
    data: {
      available_balance: 49.58894,
      voucher_balance: 46.58893,
      cash_balance: 3.00001,
    },
    scode: "0x0",
    status: true,
  })

  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.balance).toEqual({
    isAvailable: true,
    availableBalance: 49.58894,
    voucherBalance: 46.58893,
    cashBalance: 3.00001,
  })
})

test("拒绝未知 Kimi China 余额格式", () => {
  const result = parseMoonshotBalance({
    code: 0,
    data: {
      available_balance: "49.58894",
    },
  })

  expect(result.ok).toBe(false)
})
