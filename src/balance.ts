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
