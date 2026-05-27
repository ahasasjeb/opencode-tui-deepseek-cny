import type { TrackedProviderID } from "./pricing.js"

export type BalanceInfo = {
  currency: string
  totalBalance: string
  grantedBalance: string
  toppedUpBalance: string
}

export type DeepseekBalance = {
  isAvailable: boolean
  balances: BalanceInfo[]
}

export type BalanceResult =
  | {
    ok: true
    balance: DeepseekBalance
  }
  | {
    ok: false
    message: string
  }

export async function fetchDeepseekBalance(token: string, signal?: AbortSignal): Promise<BalanceResult> {
  return fetch("https://api.deepseek.com/user/balance", {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  }).then(async (response) => {
    if (!response.ok) {
      return {
        ok: false,
        message: `余额接口返回 HTTP ${response.status}`,
      }
    }

    return parseDeepseekBalance(await response.json())
  })
}

export type MoonshotBalance = {
  isAvailable: boolean
  availableBalance: number
  voucherBalance: number
  cashBalance: number
}

export type MoonshotBalanceResult =
  | {
    ok: true
    balance: MoonshotBalance
  }
  | {
    ok: false
    message: string
  }

export type DisplayBalance = {
  isAvailable: boolean
  currency: string
  totalBalance: string
  amount: number | undefined
  details: Array<{
    label: string
    value: string
  }>
}

export type DisplayBalanceResult =
  | {
    ok: true
    balance: DisplayBalance
  }
  | {
    ok: false
    message: string
  }

export async function fetchMoonshotBalance(token: string, signal?: AbortSignal): Promise<MoonshotBalanceResult> {
  return fetch("https://api.moonshot.cn/v1/users/me/balance", {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  }).then(async (response) => {
    if (!response.ok) {
      return {
        ok: false,
        message: `余额接口返回 HTTP ${response.status}`,
      }
    }

    return parseMoonshotBalance(await response.json())
  })
}

export async function fetchDisplayBalance(
  providerID: TrackedProviderID,
  token: string,
  signal?: AbortSignal,
): Promise<DisplayBalanceResult> {
  if (providerID === "deepseek") {
    const result = await fetchDeepseekBalance(token, signal)
    if (!result.ok) return result
    return {
      ok: true,
      balance: normalizeDeepseekBalance(result.balance),
    }
  }

  const result = await fetchMoonshotBalance(token, signal)
  if (!result.ok) return result
  return {
    ok: true,
    balance: normalizeMoonshotBalance(result.balance),
  }
}

export function parseDeepseekBalance(value: unknown): BalanceResult {
  if (!isRecord(value) || typeof value.is_available !== "boolean" || !Array.isArray(value.balance_infos)) {
    return {
      ok: false,
      message: "余额接口返回格式不符合预期",
    }
  }

  const balances = value.balance_infos.flatMap(parseBalanceInfo)
  if (balances.length !== value.balance_infos.length) {
    return {
      ok: false,
      message: "余额接口返回格式不符合预期",
    }
  }

  return {
    ok: true,
    balance: {
      isAvailable: value.is_available,
      balances,
    },
  }
}

export function parseMoonshotBalance(value: unknown): MoonshotBalanceResult {
  if (!isRecord(value) || !isRecord(value.data)) {
    return {
      ok: false,
      message: "余额接口返回格式不符合预期",
    }
  }

  const availableBalance = value.data.available_balance
  const voucherBalance = value.data.voucher_balance
  const cashBalance = value.data.cash_balance
  if (!isFiniteNumber(availableBalance) || !isFiniteNumber(voucherBalance) || !isFiniteNumber(cashBalance)) {
    return {
      ok: false,
      message: "余额接口返回格式不符合预期",
    }
  }

  return {
    ok: true,
    balance: {
      isAvailable: availableBalance > 0,
      availableBalance,
      voucherBalance,
      cashBalance,
    },
  }
}

function normalizeDeepseekBalance(balance: DeepseekBalance): DisplayBalance {
  const cny = balance.balances.find((item) => item.currency === "CNY")
  const item = cny ?? balance.balances[0]
  return {
    isAvailable: balance.isAvailable,
    currency: item?.currency ?? "CNY",
    totalBalance: item?.totalBalance ?? "0",
    amount: numberFromBalance(item?.totalBalance),
    details: item
      ? [
        {
          label: "赠",
          value: item.grantedBalance,
        },
        {
          label: "充",
          value: item.toppedUpBalance,
        },
      ]
      : [],
  }
}

function normalizeMoonshotBalance(balance: MoonshotBalance): DisplayBalance {
  return {
    isAvailable: balance.isAvailable,
    currency: "CNY",
    totalBalance: balance.availableBalance.toFixed(5),
    amount: balance.availableBalance,
    details: [
      {
        label: "券",
        value: balance.voucherBalance.toFixed(5),
      },
      {
        label: "现",
        value: balance.cashBalance.toFixed(5),
      },
    ],
  }
}

function parseBalanceInfo(item: unknown) {
  if (!isRecord(item)) return []
  if (typeof item.currency !== "string") return []
  if (typeof item.total_balance !== "string") return []
  if (typeof item.granted_balance !== "string") return []
  if (typeof item.topped_up_balance !== "string") return []
  return [
    {
      currency: item.currency,
      totalBalance: item.total_balance,
      grantedBalance: item.granted_balance,
      toppedUpBalance: item.topped_up_balance,
    },
  ]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function numberFromBalance(value: string | undefined) {
  if (value === undefined) return undefined
  const amount = Number(value)
  if (!Number.isFinite(amount)) return undefined
  return amount
}
