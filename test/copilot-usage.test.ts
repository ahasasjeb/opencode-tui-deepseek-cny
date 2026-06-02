import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { expect, test } from "bun:test"
import { parseCopilotUserResponse } from "../src/copilot-usage.js"

test("解析 Copilot 用户额度响应", () => {
  const response = JSON.stringify({
    access_type_sku: "free_limited_copilot",
    copilot_plan: "free",
    quota_reset_date: "2025-07-01T00:00:00Z",
    quota_snapshots: {
      chat: {
        quota_id: "chat-requests",
        entitlement: 300,
        remaining: 150,
        unlimited: false,
        overage_count: 0,
        overage_permitted: false,
        percent_remaining: 50.0,
      },
      completions: {
        quota_id: "code-completions",
        entitlement: 500,
        remaining: 200,
        unlimited: false,
        overage_count: 0,
        overage_permitted: false,
        percent_remaining: 40.0,
      },
    },
  })

  const result = parseCopilotUserResponse(response)
  expect(result.ok).toBe(true)
  if (result.ok) {
    expect(result.quota.plan).toBe("free")
    expect(result.quota.sku).toBe("free_limited_copilot")
    expect(result.quota.resetDate).toBe("2025-07-01T00:00:00Z")
    expect(result.quota.quotaSnapshots.chat.entitlement).toBe(300)
    expect(result.quota.quotaSnapshots.chat.remaining).toBe(150)
    expect(result.quota.quotaSnapshots.chat.percentRemaining).toBe(50.0)
    expect(result.quota.quotaSnapshots.completions.entitlement).toBe(500)
    expect(result.quota.quotaSnapshots.completions.remaining).toBe(200)
  }
})

test("解析空的 quota_snapshots 额度响应", () => {
  const response = JSON.stringify({
    access_type_sku: "copilot_business",
    copilot_plan: "business",
    quota_snapshots: {},
  })

  const result = parseCopilotUserResponse(response)
  expect(result.ok).toBe(true)
  if (result.ok) {
    expect(result.quota.plan).toBe("business")
    expect(result.quota.sku).toBe("copilot_business")
    expect(Object.keys(result.quota.quotaSnapshots)).toHaveLength(0)
    expect(result.quota.resetDate).toBeNull()
  }
})

test("解析含 premium_interactions 的额度响应", () => {
  const response = JSON.stringify({
    access_type_sku: "copilot_business",
    copilot_plan: "business",
    quota_reset_date: "2025-08-01T00:00:00Z",
    quota_snapshots: {
      chat: {
        quota_id: "chat-requests",
        entitlement: 300,
        remaining: 280,
        unlimited: false,
        overage_count: 0,
        overage_permitted: false,
        percent_remaining: 93.3,
      },
      premium_interactions: {
        quota_id: "premium-chat-requests",
        entitlement: 100,
        remaining: 80,
        unlimited: false,
        overage_count: 0,
        overage_permitted: false,
        percent_remaining: 80.0,
      },
    },
  })

  const result = parseCopilotUserResponse(response)
  expect(result.ok).toBe(true)
  if (result.ok) {
    expect(result.quota.quotaSnapshots.premium_interactions).toBeDefined()
    expect(result.quota.quotaSnapshots.premium_interactions.quotaId).toBe("premium-chat-requests")
    expect(result.quota.quotaSnapshots.premium_interactions.remaining).toBe(80)
    expect(result.quota.resetDate).toBe("2025-08-01T00:00:00Z")
  }
})

test("解析无限制额度的响应", () => {
  const response = JSON.stringify({
    access_type_sku: "copilot_business",
    copilot_plan: "business",
    quota_snapshots: {
      chat: {
        quota_id: "chat-requests",
        entitlement: -1,
        remaining: -1,
        unlimited: true,
        overage_count: 0,
        overage_permitted: true,
        percent_remaining: 100.0,
      },
    },
  })

  const result = parseCopilotUserResponse(response)
  expect(result.ok).toBe(true)
  if (result.ok) {
    expect(result.quota.quotaSnapshots.chat.unlimited).toBe(true)
    expect(result.quota.quotaSnapshots.chat.entitlement).toBe(-1)
  }
})

test("使用 OPENCODE_AUTH_CONTENT 读取 Copilot 凭证", async () => {
  const { readCopilotOAuth } = await import("../src/copilot-usage.js")
  const previous = process.env.OPENCODE_AUTH_CONTENT
  process.env.OPENCODE_AUTH_CONTENT = JSON.stringify({
    version: 2,
    accounts: {
      acc_copilot: {
        id: "acc_copilot",
        serviceID: "github-copilot",
        credential: {
          type: "oauth",
          access: "env-gh-access",
          refresh: "env-gh-refresh",
          expires: 456,
        },
      },
    },
    active: {
      "github-copilot": "acc_copilot",
    },
  })

  try {
    await expect(readCopilotOAuth("missing-dir")).resolves.toEqual({
      type: "oauth",
      access: "env-gh-access",
      refresh: "env-gh-refresh",
      expires: 456,
      enterpriseUrl: undefined,
    })
  } finally {
    if (previous === undefined) delete process.env.OPENCODE_AUTH_CONTENT
    else process.env.OPENCODE_AUTH_CONTENT = previous
  }
})

test("使用 OPENCODE_AUTH_CONTENT 读取含 enterpriseUrl 的 Copilot 凭证", async () => {
  const { readCopilotOAuth } = await import("../src/copilot-usage.js")
  const previous = process.env.OPENCODE_AUTH_CONTENT
  process.env.OPENCODE_AUTH_CONTENT = JSON.stringify({
    version: 2,
    accounts: {
      acc_copilot: {
        id: "acc_copilot",
        serviceID: "github-copilot",
        credential: {
          type: "oauth",
          access: "env-access",
          refresh: "env-refresh",
          expires: 0,
          enterpriseUrl: "company.ghe.com",
        },
      },
    },
    active: {
      "github-copilot": "acc_copilot",
    },
  })

  try {
    await expect(readCopilotOAuth("missing-dir")).resolves.toEqual({
      type: "oauth",
      access: "env-access",
      refresh: "env-refresh",
      expires: 0,
      enterpriseUrl: "company.ghe.com",
    })
  } finally {
    if (previous === undefined) delete process.env.OPENCODE_AUTH_CONTENT
    else process.env.OPENCODE_AUTH_CONTENT = previous
  }
})

test("OPENCODE_AUTH_CONTENT 中无 Copilot 凭证时搜索文件系统", async () => {
  const { readCopilotOAuth } = await import("../src/copilot-usage.js")
  const previous = process.env.OPENCODE_AUTH_CONTENT
  process.env.OPENCODE_AUTH_CONTENT = JSON.stringify({
    version: 2,
    accounts: {
      acc_openai: {
        id: "acc_openai",
        serviceID: "openai",
        credential: {
          type: "oauth",
          access: "openai-access",
          refresh: "openai-refresh",
          expires: 0,
        },
      },
    },
    active: {
      openai: "acc_openai",
    },
  })

  try {
    const result = await readCopilotOAuth("missing-dir")
    if (result === null) {
      expect(result).toBeNull()
    } else {
      expect(result.type).toBe("oauth")
      expect(typeof result.refresh).toBe("string")
      expect(typeof result.access).toBe("string")
    }
  } finally {
    if (previous === undefined) delete process.env.OPENCODE_AUTH_CONTENT
    else process.env.OPENCODE_AUTH_CONTENT = previous
  }
})

test("从 account.json 文件读取 Copilot 凭证", async () => {
  const { readCopilotOAuth } = await import("../src/copilot-usage.js")
  const previous = process.env.OPENCODE_AUTH_CONTENT
  delete process.env.OPENCODE_AUTH_CONTENT
  const dir = await mkdtemp(join(tmpdir(), "llm-cny-copilot-"))

  try {
    await writeFile(
      join(dir, "account.json"),
      JSON.stringify({
        version: 2,
        accounts: {
          acc_copilot: {
            id: "acc_copilot",
            serviceID: "github-copilot",
            credential: {
              type: "oauth",
              access: "copilot-access-token",
              refresh: "copilot-refresh-token",
              expires: 0,
            },
          },
        },
        active: {
          "github-copilot": "acc_copilot",
        },
      }),
      "utf-8",
    )

    const result = await readCopilotOAuth(dir)
    expect(result).not.toBeNull()
    if (result) {
      expect(result.type).toBe("oauth")
      expect(result.refresh).toBe("copilot-refresh-token")
      expect(result.access).toBe("copilot-access-token")
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
    if (previous !== undefined) process.env.OPENCODE_AUTH_CONTENT = previous
  }
})