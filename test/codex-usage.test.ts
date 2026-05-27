import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { expect, test } from "bun:test"
import { readCodexOAuth } from "../src/codex-usage.js"

test("读取新版 account.json 里的 OpenAI OAuth 凭证", async () => {
  const dir = await mkdtemp(join(tmpdir(), "llm-cny-codex-"))

  try {
    await writeFile(
      join(dir, "account.json"),
      JSON.stringify({
        version: 2,
        accounts: {
          acc_openai: {
            id: "acc_openai",
            serviceID: "openai",
            credential: {
              type: "oauth",
              access: "access-token",
              refresh: "refresh-token",
              expires: 123,
            },
          },
        },
        active: {
          openai: "acc_openai",
        },
      }),
      "utf-8",
    )

    await expect(readCodexOAuth(dir)).resolves.toEqual({
      type: "oauth",
      access: "access-token",
      refresh: "refresh-token",
      expires: 123,
      accountId: undefined,
    })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("优先读取 OPENCODE_AUTH_CONTENT", async () => {
  const previous = process.env.OPENCODE_AUTH_CONTENT
  process.env.OPENCODE_AUTH_CONTENT = JSON.stringify({
    version: 2,
    accounts: {
      acc_openai: {
        id: "acc_openai",
        serviceID: "openai",
        credential: {
          type: "oauth",
          access: "env-access",
          refresh: "env-refresh",
          expires: 456,
        },
      },
    },
    active: {
      openai: "acc_openai",
    },
  })

  try {
    await expect(readCodexOAuth("missing-dir")).resolves.toEqual({
      type: "oauth",
      access: "env-access",
      refresh: "env-refresh",
      expires: 456,
      accountId: undefined,
    })
  } finally {
    if (previous === undefined) delete process.env.OPENCODE_AUTH_CONTENT
    else process.env.OPENCODE_AUTH_CONTENT = previous
  }
})
